import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { normalizeEmail, normalizeName, normalizePhone } from '@/lib/utils/normalize';

const VALID_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUOTE_SENT',
  'NEGOTIATING',
  'WON',
  'LOST',
] as const;

type LeadStatus = (typeof VALID_STATUSES)[number];

export async function handleLeadStatusPatch(req: NextRequest, leadId: string, deprecated = false) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !VALID_STATUSES.includes(status as LeadStatus)) {
      return NextResponse.json({ error: 'Estat invàlid' }, { status: 400 });
    }

    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        status: true,
        contactedAt: true,
        convertedAt: true,
        customerId: true,
        email: true,
        phone: true,
        name: true,
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
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        landingPage: true,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    let linkedCustomerId = existingLead.customerId ?? null;

    if (!linkedCustomerId && existingLead.email && !existingLead.email.endsWith('@leads.orbitaevents.local')) {
      const emailNormalized = normalizeEmail(existingLead.email);
      const phoneNormalized = existingLead.phone ? normalizePhone(existingLead.phone) : null;
      const nameNormalized = normalizeName(existingLead.name);

      const customer = await prisma.customer.upsert({
        where: { emailNormalized },
        update: {
          name: existingLead.name,
          nameNormalized,
          phone: existingLead.phone || null,
          phoneNormalized,
          source: existingLead.source,
          preferredLocale: existingLead.preferredLocale || 'ca',
        },
        create: {
          email: existingLead.email.toLowerCase().trim(),
          emailNormalized,
          name: existingLead.name,
          nameNormalized,
          phone: existingLead.phone || null,
          phoneNormalized,
          source: existingLead.source,
          preferredLocale: existingLead.preferredLocale || 'ca',
        },
      });

      linkedCustomerId = customer.id;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: status as LeadStatus,
        contactedAt: status === 'CONTACTED' && !existingLead.contactedAt ? new Date() : undefined,
        convertedAt: status === 'WON' && !existingLead.convertedAt ? new Date() : undefined,
        customerId: linkedCustomerId,
      },
      select: {
        id: true,
        status: true,
        contactedAt: true,
        convertedAt: true,
        customerId: true,
      },
    });

    await prisma.leadNote.create({
      data: {
        leadId,
        content: `Canvi d'estat: ${existingLead.status} → ${status}`,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'STATUS_CHANGE',
        title: "Canvi d'estat",
        description: `${existingLead.status} → ${status}`,
      },
    });

    if (status === 'WON' && linkedCustomerId) {
      await prisma.customerActivity.create({
        data: {
          customerId: linkedCustomerId,
          action: 'LEAD_CONVERTED',
          details: {
            leadId: existingLead.id,
            fromStatus: existingLead.status,
            toStatus: status,
            eventType: existingLead.eventType,
            eventDate: existingLead.eventDate,
            eventLocation: existingLead.eventLocation,
            guestCount: existingLead.guestCount,
            budget: existingLead.budget,
            message: existingLead.message,
            interestedPackId: existingLead.interestedPackId,
            interestedExtras: existingLead.interestedExtras,
            source: existingLead.source,
            preferredLocale: existingLead.preferredLocale,
            attribution: {
              utmSource: existingLead.utmSource,
              utmMedium: existingLead.utmMedium,
              utmCampaign: existingLead.utmCampaign,
              landingPage: existingLead.landingPage,
            },
          },
        },
      });
    }

    const response = NextResponse.json({ ok: true, lead: updatedLead });
    if (deprecated) {
      response.headers.set('x-api-deprecated', 'true');
      response.headers.set('x-api-replacement', `/api/admin/leads-new/${leadId}/status`);
    }

    return response;
  } catch (error) {
    log.error('Error actualitzant estat del lead:', error);
    return NextResponse.json({ error: 'Error actualitzant estat' }, { status: 500 });
  }
}
