import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapLeadEventType, normalizeQuoteLocale, parseDateOrNull } from '@/lib/services/quotes/quoteParsing';
import { ensureQuoteFollowUpTask } from '@/lib/services/tasks/quoteFollowUp';
import { recordCustomerProposalSent } from '@/lib/services/customerActivityService';
import { DOCUMENT_ADMIN_LOG_ACTIONS, recordDocumentAdminLog } from '@/lib/services/documentAuditTrailService';

type ProposalSnapshot = {
  customer?: { name?: string; phone?: string };
  event?: { date?: string | Date | null; schedule?: string; location?: string; guests?: number | string | null };
  eventType?: string;
  whyChooseUs?: string;
  packId?: string;
};

type JsonRecord = Record<string, unknown>;

type QuoteSnapshotProposal = {
  id: string;
  reference: string;
  customerId: string | null;
  leadId: string | null;
  bookingId: string | null;
  status: string;
  locale: string;
  currency: string;
  validityDays: number;
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  snapshot: unknown;
  customer: { id: string; name: string | null; email: string | null } | null;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function textFrom(record: JsonRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function numberFrom(record: JsonRecord, key: string, fallback = 0): number {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
}

function extrasArray(value: unknown): Array<{ id: string | null; name: string; description: string | null; price: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asRecord(item);
      const name = textFrom(row, 'name');
      if (!name) return null;
      return {
        id: textFrom(row, 'id') || null,
        name,
        description: textFrom(row, 'description') || null,
        price: numberFrom(row, 'price'),
      };
    })
    .filter((item): item is { id: string | null; name: string; description: string | null; price: number } => !!item);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function buildQuoteDocumentSnapshot(proposal: QuoteSnapshotProposal, createdAt: Date = new Date()) {
  const snapshot = asRecord(proposal.snapshot);
  const customer = asRecord(snapshot.customer);
  const event = asRecord(snapshot.event);
  const pricing = asRecord(snapshot.pricing);
  const extras = asRecord(snapshot.extras);
  const brand = asRecord(snapshot.brand);
  const createdAtIso = createdAt.toISOString();

  return {
    version: 1,
    createdAt: createdAtIso,
    source: 'admin_proposal_send',
    documentType: 'PROPOSAL',
    proposalId: proposal.id,
    reference: proposal.reference,
    statusAtFreeze: proposal.status,
    locale: proposal.locale,
    currency: proposal.currency,
    validityDays: proposal.validityDays,
    customer: {
      customerId: proposal.customerId,
      name: textFrom(customer, 'name') || proposal.customer?.name || 'Client',
      email: proposal.customer?.email || textFrom(customer, 'email') || null,
      phone: textFrom(customer, 'phone') || null,
      contact: textFrom(customer, 'contact') || null,
    },
    event: {
      eventType: textFrom(snapshot, 'eventType'),
      date: event.date ?? null,
      schedule: textFrom(event, 'schedule') || null,
      location: textFrom(event, 'location') || null,
      guests: numberFrom(event, 'guests'),
    },
    pack: {
      packId: textFrom(snapshot, 'packId') || null,
      name: textFrom(snapshot, 'packName') || 'Pack',
      basePrice: numberFrom(snapshot, 'basePrice'),
      durationHours: numberFrom(snapshot, 'durationHours'),
      features: stringArray(snapshot.features),
    },
    extras: {
      preset: extrasArray(extras.preset),
      custom: extrasArray(extras.custom),
      total: numberFrom(pricing, 'extrasPrice'),
    },
    pricing: {
      subtotal: proposal.subtotal,
      discount: proposal.discount,
      vatRate: proposal.vatRate,
      vatAmount: proposal.vatAmount,
      total: proposal.total,
      discountReason: textFrom(pricing, 'discountReason') || null,
      travelKm: numberFrom(pricing, 'travelKm'),
      travelCharge: numberFrom(pricing, 'travelCharge'),
      seasonSurcharge: numberFrom(pricing, 'seasonSurcharge'),
      seasonLabel: textFrom(pricing, 'seasonLabel') || null,
      seasonPct: pricing.seasonPct === undefined ? null : numberFrom(pricing, 'seasonPct'),
    },
    conditions: stringArray(snapshot.conditions),
    whyChooseUs: textFrom(snapshot, 'whyChooseUs') || null,
    brand: {
      name: textFrom(brand, 'brandName') || null,
      website: textFrom(brand, 'brandWebsite') || null,
      email: textFrom(brand, 'brandEmail') || null,
      phone: textFrom(brand, 'brandPhone') || null,
      tagline: textFrom(brand, 'brandTagline') || null,
    },
    trace: {
      frozenFrom: 'Proposal.snapshot+Proposal.fields',
      safety: 'QUOTE_SNAPSHOT_V1',
      sentAt: createdAtIso,
      leadId: proposal.leadId,
      bookingId: proposal.bookingId,
    },
  };
}

function mergeQuoteDocumentSnapshot(snapshot: unknown, quoteSnapshot: ReturnType<typeof buildQuoteDocumentSnapshot>) {
  return toJsonValue({
    ...asRecord(snapshot),
    quoteSnapshot,
  });
}

export async function sendAdminProposal(id: string) {
  const existing = await prisma.proposal.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!existing) {
    return { status: 404, body: { ok: false, error: 'Pressupost no trobat' } };
  }

  const customer = existing.customer;
  const customerId = existing.customerId;
  if (!customer || !customerId) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Aquest pressupost no té client assignat. Vincula un client abans d\'enviar-lo.',
      },
    };
  }

  let ensuredLeadId = existing.leadId || null;

  if (!ensuredLeadId) {
    const snapshot = ((existing.snapshot as ProposalSnapshot | null) || {}) satisfies ProposalSnapshot;
    const snapshotCustomer = snapshot.customer || {};
    const snapshotEvent = snapshot.event || {};

    const reusableLead = await prisma.lead.findFirst({
      where: {
        OR: [{ customerId: customerId }, { email: customer.email }],
        status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    if (reusableLead) {
      ensuredLeadId = reusableLead.id;
    } else {
      const createdLead = await prisma.lead.create({
        data: {
          customerId: customerId,
          name: customer.name || String(snapshotCustomer.name || 'Client'),
          email: customer.email,
          phone: snapshotCustomer.phone ? String(snapshotCustomer.phone) : null,
          eventType: mapLeadEventType(snapshot.eventType),
          eventDate: parseDateOrNull(snapshotEvent.date),
          eventSchedule: snapshotEvent.schedule ? String(snapshotEvent.schedule) : null,
          eventLocation: snapshotEvent.location ? String(snapshotEvent.location) : null,
          guestCount: Number.isFinite(Number(snapshotEvent.guests)) ? Math.max(0, Math.round(Number(snapshotEvent.guests))) : null,
          budget: Number.isFinite(Number(existing.total)) ? String(Number(existing.total).toFixed(2)) : null,
          message: snapshot.whyChooseUs ? String(snapshot.whyChooseUs) : null,
          interestedPackId: snapshot.packId ? String(snapshot.packId) : null,
          interestedExtras: [],
          source: 'OTHER',
          status: 'QUOTE_SENT',
          preferredLocale: normalizeQuoteLocale(existing.locale),
        },
        select: { id: true },
      });
      ensuredLeadId = createdLead.id;
    }
  }

  const sentAt = new Date();
  const quoteSnapshot = buildQuoteDocumentSnapshot(
    {
      id: existing.id,
      reference: existing.reference,
      customerId: existing.customerId,
      leadId: ensuredLeadId,
      bookingId: existing.bookingId,
      status: 'SENT',
      locale: existing.locale,
      currency: existing.currency,
      validityDays: existing.validityDays,
      subtotal: existing.subtotal,
      discount: existing.discount,
      vatRate: existing.vatRate,
      vatAmount: existing.vatAmount,
      total: existing.total,
      snapshot: existing.snapshot,
      customer: existing.customer,
    },
    sentAt,
  );

  const proposal = await prisma.proposal.update({
    where: { id },
    data: {
      leadId: ensuredLeadId,
      status: 'SENT',
      sentAt,
      snapshot: mergeQuoteDocumentSnapshot(existing.snapshot, quoteSnapshot),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true } },
    },
  });

  await recordCustomerProposalSent({
    customerId,
    proposalId: proposal.id,
    reference: proposal.reference,
    total: proposal.total,
  });

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.PROPOSAL_SENT,
    entity: 'proposal',
    entityId: proposal.id,
    details: {
      documentType: 'PROPOSAL',
      source: 'admin_proposal_send',
      reference: proposal.reference,
      proposalId: proposal.id,
      proposalReference: proposal.reference,
      customerId,
      leadId: proposal.leadId || proposal.lead?.id || ensuredLeadId,
      bookingId: proposal.bookingId,
      total: proposal.total,
      locale: proposal.locale,
      to: customer.email,
    },
  });

  await ensureQuoteFollowUpTask({
    title: `Seguiment pressupost ${proposal.reference}`,
    description: 'Contactar client per confirmar resposta al pressupost enviat.',
    leadId: proposal.leadId || proposal.lead?.id || ensuredLeadId,
    customerId,
    bookingId: proposal.bookingId,
    proposalId: proposal.id,
  });

  return { status: 200, body: { ok: true, proposal } };
}
