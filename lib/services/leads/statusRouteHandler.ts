import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { normalizeEmail, normalizeName, normalizePhone } from '@/lib/utils/normalize';
import { LEAD_STATUS_VALUES, PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { recordLeadConverted } from '@/lib/services/customerActivityService';
import { markLeadAsLost } from '@/lib/services/leadLossService';
import { recordLeadStatusChanged } from '@/lib/services/leadActivityService';

type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

export async function handleLeadStatusPatch(req: NextRequest, leadId: string) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { status, lostReason, note } = body as { status?: string; lostReason?: string; note?: string };

    if (!status || !LEAD_STATUS_VALUES.includes(status as LeadStatus)) {
      return NextResponse.json({ error: 'Estat invàlid' }, { status: 400 });
    }

    // Canonical path for LOST with reason — delegates to markLeadAsLost() so the
    // audit trail (lostReason, lostAt, leadActivity metadata) stays consistent
    // regardless of whether the transition is manual or automatic.
    if (status === 'LOST' && typeof lostReason === 'string' && lostReason.length > 0) {
      const lossResult = await markLeadAsLost({
        leadId,
        reason: lostReason,
        note: typeof note === 'string' ? note : null,
        actor: 'Admin',
      });

      if (!lossResult.ok) {
        return NextResponse.json({ error: lossResult.error }, { status: lossResult.status });
      }

      return NextResponse.json({ ok: true, lead: lossResult.lead });
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
        booking: { select: { id: true } },
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    if (status === 'WON' && existingLead.status !== 'WON' && !existingLead.booking?.id) {
      return NextResponse.json({
        error: 'No es pot marcar un lead com a guanyat sense reserva vinculada. Crea la reserva des del lead perquè Booking sigui la veritat operativa.',
        nextAction: `/admin/bookings/new?leadId=${encodeURIComponent(leadId)}&prefill=lead`,
      }, { status: 409 });
    }

    let linkedCustomerId = existingLead.customerId ?? null;

    if (!linkedCustomerId && existingLead.email && !existingLead.email.endsWith(PLACEHOLDER_EMAIL_DOMAIN)) {
      const emailNormalized = normalizeEmail(existingLead.email);
      const phoneNormalized = existingLead.phone ? normalizePhone(existingLead.phone) : null;
      const nameNormalized = normalizeName(existingLead.name);

      let customer;
      try {
        customer = await prisma.customer.upsert({
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
      } catch (upsertErr: unknown) {
        // P2002: email unique violation — customer exists with same email but different
        // emailNormalized (e.g. created before Gmail dot-stripping was applied)
        const isPrismaP2002 = typeof upsertErr === 'object' && upsertErr !== null
          && 'code' in upsertErr && (upsertErr as { code: string }).code === 'P2002';
        if (!isPrismaP2002) throw upsertErr;
        const rawEmail = existingLead.email.toLowerCase().trim();
        const existing = await prisma.customer.findFirst({ where: { email: rawEmail }, select: { id: true } });
        if (!existing) throw upsertErr;
        customer = existing;
      }

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

    await recordLeadStatusChanged({
      leadId,
      fromStatus: existingLead.status,
      toStatus: status,
    });

    if (status === 'WON' && linkedCustomerId) {
      await recordLeadConverted({
        customerId: linkedCustomerId,
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
      });
    }

    return NextResponse.json({ ok: true, lead: updatedLead });
  } catch (error) {
    log.error('Error actualitzant estat del lead:', error);
    return NextResponse.json({ error: 'Error actualitzant estat' }, { status: 500 });
  }
}
