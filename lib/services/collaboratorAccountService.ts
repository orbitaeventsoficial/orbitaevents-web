// lib/services/collaboratorAccountService.ts
// ═══════════════════════════════════════════════════════════════════════════
// COMPTE CORRENT DE COL·LABORADOR (col·laborador mutu — cas Masquerade/Carlos Lucas)
// Un soci pot jugar dos papers alhora:
//   · «Li dec»  → Òrbita li ha de pagar (revenda dels seus serveis). Ja ho calcula
//                 el motor `collaboratorPayoutService` (la seva «pasta» ENTREGADA sense pagar).
//   · «Em deu»  → ell contracta Òrbita (bolos facturats a ell). El client és el soci,
//                 no un client final; es reconeix per `billedCollaboratorId` a la reserva.
// Aquest servei NO reinventa cap regla: reusa el payout (li dec) i l'import pendent
// canònic (`bookingOutstandingAmount`, em deu) i en deriva el SALDO NET.
// Part pura (`composeCollaboratorAccount`) + wrapper Prisma (`loadCollaboratorAccount`).
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { loadCollaboratorPayout } from '@/lib/services/collaboratorPayoutService';
import { bookingOutstandingAmount } from '@/lib/payment-status';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Reserva facturada al soci (ell és el client) amb el seu pendent de cobrar. */
export type BilledToPartnerBooking = {
  bookingId: string;
  reference: string;
  clientName: string;
  eventDate: Date | null;
  total: number;
  outstanding: number;
  paid: boolean;
};

export type CollaboratorAccount = {
  collaboratorId: string;
  collaboratorName: string;
  /** Òrbita → soci: la seva pasta entregada i encara no pagada (i el previst futur). */
  iOwe: { pending: number; upcoming: number; paid: number };
  /** Soci → Òrbita: bolos que ell ha contractat, facturats a ell. */
  owesMe: { billedTotal: number; outstanding: number; bookings: BilledToPartnerBooking[] };
  /** Saldo net: > 0 → el soci em deu; < 0 → jo li dec; 0 → en paus. */
  balance: number;
};

/** Forma mínima de reserva facturada al soci (per a la part pura). */
export type BilledBookingInput = {
  id: string;
  reference: string;
  clientName: string;
  eventDate: Date | null;
  total: number;
  depositAmount: number;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount: number | null;
};

/**
 * Composició pura (sense I/O): fusiona el que Òrbita deu al soci (payout) amb el que
 * el soci deu a Òrbita (reserves facturades) i en deriva el saldo net.
 */
export function composeCollaboratorAccount(input: {
  collaboratorId: string;
  collaboratorName: string;
  payoutTotals: { previ: number; aPagar: number; pagat: number };
  billedBookings: BilledBookingInput[];
}): CollaboratorAccount {
  const bookings: BilledToPartnerBooking[] = input.billedBookings.map((b) => {
    const outstanding = bookingOutstandingAmount(b);
    return {
      bookingId: b.id,
      reference: b.reference,
      clientName: b.clientName,
      eventDate: b.eventDate,
      total: round2(b.total),
      outstanding,
      paid: outstanding <= 0,
    };
  });

  const billedTotal = round2(bookings.reduce((s, b) => s + b.total, 0));
  const owesMeOutstanding = round2(bookings.reduce((s, b) => s + b.outstanding, 0));
  const iOwePending = round2(input.payoutTotals.aPagar);
  const balance = round2(owesMeOutstanding - iOwePending);

  return {
    collaboratorId: input.collaboratorId,
    collaboratorName: input.collaboratorName,
    iOwe: {
      pending: iOwePending,
      upcoming: round2(input.payoutTotals.previ),
      paid: round2(input.payoutTotals.pagat),
    },
    owesMe: { billedTotal, outstanding: owesMeOutstanding, bookings },
    balance,
  };
}

/** Wrapper amb I/O: carrega payout + reserves facturades al soci i en composa el compte. */
export async function loadCollaboratorAccount(collaboratorId: string): Promise<CollaboratorAccount | null> {
  const [payout, billed] = await Promise.all([
    loadCollaboratorPayout(collaboratorId),
    prisma.booking.findMany({
      where: { billedCollaboratorId: collaboratorId, status: { not: 'CANCELLED' } },
      select: {
        id: true,
        reference: true,
        clientName: true,
        eventDate: true,
        total: true,
        depositAmount: true,
        depositPaid: true,
        remainingPaid: true,
        cashAmount: true,
      },
      orderBy: { eventDate: 'desc' },
    }),
  ]);
  if (!payout) return null;

  return composeCollaboratorAccount({
    collaboratorId: payout.collaboratorId,
    collaboratorName: payout.collaboratorName,
    payoutTotals: payout.totals,
    billedBookings: billed,
  });
}
