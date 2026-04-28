import { EventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAdminLead } from '@/lib/services/leadAdminService';
import { createAdminProposal } from '@/lib/services/proposalAdminService';
import { createBookingFromInput } from '@/lib/services/bookingCreationService';

export type QuickCreateOutcome = 'lead' | 'lead+proposal' | 'lead+proposal+booking';

export type QuickCreateInput = {
  outcome: QuickCreateOutcome;
  client: {
    name: string;
    email: string;
    phone?: string;
    dni?: string;
  };
  event: {
    eventType: string;
    eventDate?: string;
    eventStartTime?: string;
    eventEndTime?: string;
    eventLocation?: string;
    eventVenue?: string;
    guestCount?: number;
    message?: string;
    interestedPackId?: string;
    budget?: string;
  };
  proposalSubtotal?: number;
  proposalSnapshot?: Record<string, unknown>;
};

export type QuickCreateResult =
  | {
      ok: true;
      leadId: string;
      proposalId: string | null;
      bookingId: string | null;
    }
  | { ok: false; error: string; status: number; stage: 'lead' | 'proposal' | 'booking' };

const PROPOSAL_DEFAULT_VALIDITY = 15;
const PROPOSAL_VAT_RATE = 21;

export async function quickCreate(input: QuickCreateInput): Promise<QuickCreateResult> {
  const wantProposal =
    input.outcome === 'lead+proposal' || input.outcome === 'lead+proposal+booking';
  const wantBooking = input.outcome === 'lead+proposal+booking';

  if (wantBooking) {
    if (!input.event.eventDate) {
      return { ok: false, error: 'Cal data per crear la reserva', status: 400, stage: 'booking' };
    }
    if (!input.event.eventLocation) {
      return { ok: false, error: 'Cal lloc per crear la reserva', status: 400, stage: 'booking' };
    }
    if (!input.event.guestCount || input.event.guestCount < 1) {
      return {
        ok: false,
        error: 'Cal nombre d\'invitats per crear la reserva',
        status: 400,
        stage: 'booking',
      };
    }
    if (!input.event.interestedPackId) {
      return { ok: false, error: 'Cal pack per crear la reserva', status: 400, stage: 'booking' };
    }
    if (!input.client.phone) {
      return { ok: false, error: 'Cal telèfon per crear la reserva', status: 400, stage: 'booking' };
    }
  }

  // 1. Lead — sempre es crea
  const leadResult = await createAdminLead({
    name: input.client.name,
    email: input.client.email,
    phone: input.client.phone,
    dni: input.client.dni,
    eventType: (input.event.eventType as EventType),
    eventDate: input.event.eventDate,
    eventLocation: input.event.eventLocation,
    eventVenue: input.event.eventVenue,
    guestCount: input.event.guestCount,
    budget: input.event.budget,
    message: input.event.message,
    interestedPackId: input.event.interestedPackId,
    source: 'OTHER',
  });
  if (!leadResult?.ok || !leadResult.lead?.id) {
    return { ok: false, error: 'Error creant lead', status: 500, stage: 'lead' };
  }
  const leadId = leadResult.lead.id;

  // 2. Proposal — opcional
  let proposalId: string | null = null;
  if (wantProposal) {
    const subtotal = input.proposalSubtotal ?? 0;
    const vatAmount = subtotal * (PROPOSAL_VAT_RATE / 100);
    const total = subtotal + vatAmount;
    const snapshot = input.proposalSnapshot ?? {
      customer: { name: input.client.name, email: input.client.email },
      event: {
        type: input.event.eventType,
        date: input.event.eventDate ?? null,
        location: input.event.eventLocation ?? null,
        guests: input.event.guestCount ?? null,
      },
      packId: input.event.interestedPackId ?? null,
    };
    try {
      const proposalResult = await createAdminProposal({
        leadId,
        currency: 'EUR',
        validityDays: PROPOSAL_DEFAULT_VALIDITY,
        subtotal,
        discount: 0,
        vatRate: PROPOSAL_VAT_RATE,
        vatAmount,
        total,
        snapshot,
      });
      proposalId = (proposalResult as { proposal?: { id?: string } }).proposal?.id ?? null;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'unknown';
      return {
        ok: false,
        error: `Error creant pressupost: ${errMsg}`,
        status: 500,
        stage: 'proposal',
      };
    }
  }

  // 3. Booking — opcional, requereix dades validades més amunt
  let bookingId: string | null = null;
  if (wantBooking) {
    const result = await createBookingFromInput({
      leadId,
      clientName: input.client.name,
      clientEmail: input.client.email,
      clientPhone: input.client.phone!,
      eventType: input.event.eventType,
      eventDate: input.event.eventDate!,
      eventStartTime: input.event.eventStartTime,
      eventEndTime: input.event.eventEndTime,
      eventLocation: input.event.eventLocation!,
      eventVenue: input.event.eventVenue,
      guestCount: input.event.guestCount!,
      packId: input.event.interestedPackId!,
      extras: [],
    });
    if (result.status >= 400) {
      const body = result.body as { error?: string };
      return {
        ok: false,
        error: body?.error || 'Error creant reserva',
        status: result.status,
        stage: 'booking',
      };
    }
    const body = result.body as { booking?: { id?: string }; id?: string };
    bookingId = body?.booking?.id ?? body?.id ?? null;

    // Connect lead → booking is automatic via leadId at creation; double-check the proposal is linked too
    if (proposalId && bookingId) {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { bookingId },
      });
    }
  }

  return { ok: true, leadId, proposalId, bookingId };
}
