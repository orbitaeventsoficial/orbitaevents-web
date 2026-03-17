import { prisma } from '@/lib/prisma';
import { mapLeadEventType, normalizeQuoteLocale, parseDateOrNull } from '@/lib/services/quotes/quoteParsing';
import { ensureQuoteFollowUpTask } from '@/lib/services/tasks/quoteFollowUp';

type ProposalSnapshot = {
  customer?: { name?: string; phone?: string };
  event?: { date?: string | Date | null; schedule?: string; location?: string; guests?: number | string | null };
  eventType?: string;
  whyChooseUs?: string;
  packId?: string;
};

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

  let ensuredLeadId = existing.leadId || null;

  if (!ensuredLeadId) {
    const snapshot = ((existing.snapshot as ProposalSnapshot | null) || {}) satisfies ProposalSnapshot;
    const snapshotCustomer = snapshot.customer || {};
    const snapshotEvent = snapshot.event || {};

    const reusableLead = await prisma.lead.findFirst({
      where: {
        OR: [{ customerId: existing.customerId }, { email: existing.customer.email }],
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
          customerId: existing.customerId,
          name: existing.customer.name || String(snapshotCustomer.name || 'Client'),
          email: existing.customer.email,
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

  const proposal = await prisma.proposal.update({
    where: { id },
    data: {
      leadId: ensuredLeadId,
      status: 'SENT',
      sentAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true } },
    },
  });

  await prisma.customerActivity.create({
    data: {
      customerId: proposal.customerId,
      action: 'PROPOSAL_SENT',
      details: { proposalId: proposal.id, reference: proposal.reference, total: proposal.total },
    },
  });

  await ensureQuoteFollowUpTask({
    title: `Seguiment pressupost ${proposal.reference}`,
    description: 'Contactar client per confirmar resposta al pressupost enviat.',
    leadId: proposal.leadId || proposal.lead?.id || ensuredLeadId,
    customerId: proposal.customerId,
    bookingId: proposal.bookingId,
    proposalId: proposal.id,
  });

  return { status: 200, body: { ok: true, proposal } };
}


