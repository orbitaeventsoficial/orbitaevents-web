import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  normalizeDni,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from '@/lib/utils/normalize';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { recordLeadConverted } from '@/lib/services/customerActivityService';

export type CustomerMatchKind = 'email' | 'dni' | 'phone' | 'name';

export type CustomerMatchSummary = {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerDni: string | null;
  matchedBy: CustomerMatchKind[];
  confidence: 'strong' | 'medium';
};

export type LeadCustomerPreview =
  | { kind: 'lead-not-found' }
  | { kind: 'already-linked'; customer: CustomerMatchSummary }
  | { kind: 'matches-found'; matches: CustomerMatchSummary[] }
  | { kind: 'no-match' };

export async function previewLeadCustomerLink(
  leadId: string,
): Promise<LeadCustomerPreview> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      phone: true,
      dni: true,
      customer: {
        select: { id: true, name: true, email: true, phone: true, dni: true },
      },
    },
  });
  if (!lead) return { kind: 'lead-not-found' };

  if (lead.customerId && lead.customer) {
    return {
      kind: 'already-linked',
      customer: {
        customerId: lead.customer.id,
        customerName: lead.customer.name,
        customerEmail: lead.customer.email,
        customerPhone: lead.customer.phone,
        customerDni: lead.customer.dni,
        matchedBy: [],
        confidence: 'strong',
      },
    };
  }

  const emailNorm =
    lead.email && !lead.email.endsWith(PLACEHOLDER_EMAIL_DOMAIN)
      ? normalizeEmail(lead.email)
      : null;
  const phoneNorm = lead.phone ? normalizePhone(lead.phone) : null;
  const dniNorm = lead.dni ? normalizeDni(lead.dni) : null;
  // Name match: only as last-resort signal (>=3 chars normalized to avoid noise like "Joan")
  const nameNorm = lead.name ? normalizeName(lead.name) : null;
  const nameSearchable = nameNorm && nameNorm.length >= 3 ? nameNorm : null;

  const orClauses: Prisma.CustomerWhereInput[] = [];
  if (emailNorm) orClauses.push({ emailNormalized: emailNorm });
  if (phoneNorm) orClauses.push({ phoneNormalized: phoneNorm });
  if (dniNorm) orClauses.push({ dniNormalized: dniNorm });
  if (nameSearchable) orClauses.push({ nameNormalized: nameSearchable });

  if (orClauses.length === 0) return { kind: 'no-match' };

  const candidates = await prisma.customer.findMany({
    where: { OR: orClauses },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dni: true,
      emailNormalized: true,
      phoneNormalized: true,
      dniNormalized: true,
      nameNormalized: true,
    },
    take: 10,
  });

  if (candidates.length === 0) return { kind: 'no-match' };

  const matches: CustomerMatchSummary[] = candidates.map((c) => {
    const matchedBy: CustomerMatchKind[] = [];
    if (emailNorm && c.emailNormalized === emailNorm) matchedBy.push('email');
    if (dniNorm && c.dniNormalized === dniNorm) matchedBy.push('dni');
    if (phoneNorm && c.phoneNormalized === phoneNorm) matchedBy.push('phone');
    if (nameSearchable && c.nameNormalized === nameSearchable) matchedBy.push('name');
    const confidence: 'strong' | 'medium' =
      matchedBy.includes('email') || matchedBy.includes('dni') ? 'strong' : 'medium';
    return {
      customerId: c.id,
      customerName: c.name,
      customerEmail: c.email,
      customerPhone: c.phone,
      customerDni: c.dni,
      matchedBy,
      confidence,
    };
  });

  matches.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === 'strong' ? -1 : 1;
    return b.matchedBy.length - a.matchedBy.length;
  });

  return { kind: 'matches-found', matches };
}

export type LinkLeadResult =
  | { ok: true; customerId: string; created: boolean; alreadyLinked: boolean }
  | { ok: false; error: string; status: number };

export async function linkLeadToCustomer(input: {
  leadId: string;
  action: 'link' | 'create';
  customerId?: string;
  actor?: string;
}): Promise<LinkLeadResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      phone: true,
      dni: true,
      eventType: true,
      eventDate: true,
      eventLocation: true,
      guestCount: true,
      budget: true,
      message: true,
      interestedPackId: true,
      interestedExtras: true,
      source: true,
      preferredLocale: true,
      status: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      landingPage: true,
    },
  });
  if (!lead) return { ok: false, error: 'Lead no trobat', status: 404 };

  if (lead.customerId) {
    return { ok: true, customerId: lead.customerId, created: false, alreadyLinked: true };
  }

  let resolvedCustomerId: string;
  let created = false;

  if (input.action === 'link') {
    if (!input.customerId) {
      return { ok: false, error: 'Cal customerId per vincular', status: 400 };
    }
    const exists = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: 'Client no trobat', status: 404 };
    resolvedCustomerId = exists.id;
  } else {
    if (!lead.email || lead.email.endsWith(PLACEHOLDER_EMAIL_DOMAIN)) {
      return {
        ok: false,
        error: 'El lead no té email vàlid per crear un client nou',
        status: 400,
      };
    }
    const emailNormalized = normalizeEmail(lead.email);
    const phoneNormalized = lead.phone ? normalizePhone(lead.phone) : null;
    const nameNormalized = normalizeName(lead.name);
    const dniNormalized = lead.dni ? normalizeDni(lead.dni) : null;

    const conflict = await prisma.customer.findFirst({
      where: {
        OR: [
          { emailNormalized },
          ...(dniNormalized ? [{ dniNormalized }] : []),
        ],
      },
      select: { id: true },
    });
    if (conflict) {
      return {
        ok: false,
        error: 'Ja existeix un client amb aquest email o DNI. Cal vincular en lloc de crear.',
        status: 409,
      };
    }

    const customer = await prisma.customer.create({
      data: {
        email: lead.email.toLowerCase().trim(),
        emailNormalized,
        name: lead.name,
        nameNormalized,
        phone: lead.phone || null,
        phoneNormalized,
        dni: lead.dni ? lead.dni.trim() : null,
        dniNormalized,
        source: lead.source,
        preferredLocale: lead.preferredLocale || 'ca',
      },
      select: { id: true },
    });
    resolvedCustomerId = customer.id;
    created = true;
  }

  await prisma.lead.update({
    where: { id: input.leadId },
    data: { customerId: resolvedCustomerId },
  });

  await recordLeadConverted({
    customerId: resolvedCustomerId,
    leadId: lead.id,
    fromStatus: lead.status,
    toStatus: lead.status,
    eventType: lead.eventType,
    eventDate: lead.eventDate,
    eventLocation: lead.eventLocation,
    guestCount: lead.guestCount,
    budget: lead.budget,
    message: lead.message,
    interestedPackId: lead.interestedPackId,
    interestedExtras: lead.interestedExtras,
    source: lead.source,
    preferredLocale: lead.preferredLocale,
    attribution: {
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      landingPage: lead.landingPage,
      manualAction: input.action,
      actor: input.actor || 'Admin',
    },
  });

  return { ok: true, customerId: resolvedCustomerId, created, alreadyLinked: false };
}
