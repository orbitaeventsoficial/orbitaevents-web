/**
 * collaboratorPayoutService.ts — La «pasta» d'UN col·laborador (#1364)
 *
 * Font ÚNICA de la liquidació per col·laborador: per a cada bolo on participa,
 * calcula la seva part amb el motor canònic `computeBoloRepartiment` (la MATEIXA
 * veritat que la fitxa de lead/reserva i el repartiment mensual) i la creua amb
 * els pagaments registrats (`CollaboratorPayment`, per bolo) per classificar-la:
 *
 *  - PREVI     → bolo amb data futura (encara no fet)
 *  - ENTREGAT  → bolo fet (data passada) però ENCARA no pagat
 *  - PAGAT     → registrat un CollaboratorPayment per aquell bolo
 *
 * No reimplementa cap regla de diners: només projecta el motor + l'estat de pagament.
 */

import { prisma } from '@/lib/prisma';
import { computeBoloRepartiment } from '@/lib/services/repartimentService';
import type { CrewLineInput, Jornada } from '@/lib/services/crewScheduleService';
import { toDateKey, computeJornada, LEAD_STATUSES_ACTIVE, BOOKING_STATUSES_ACTIVE } from '@/lib/services/crewScheduleService';

export type PayoutBoloStatus = 'PREVI' | 'ENTREGAT' | 'PAGAT';

export interface CollaboratorPayoutBolo {
  origin: 'lead' | 'booking';
  parentId: string;
  parentRef: string;
  dateKey: string | null;
  eventDate: Date | null;
  status: PayoutBoloStatus;
  /** Part que li toca a aquest col·laborador d'aquest bolo (cash). */
  amount: number;
  /** Pagament registrat (si n'hi ha). */
  paidAt: string | null;
  paymentId: string | null;
  paymentMethod: string | null;
  // Logística de la jornada (#1364): per al PDF de liquidació.
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string | null;
  jornada: Jornada;
}

export interface CollaboratorPayoutMonth {
  month: string; // YYYY-MM
  previ: number;
  aPagar: number; // entregat pendent
  pagat: number;
}

export interface CollaboratorPayoutSummary {
  collaboratorId: string;
  collaboratorName: string;
  totals: { previ: number; aPagar: number; pagat: number };
  bolos: CollaboratorPayoutBolo[];
  months: CollaboratorPayoutMonth[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Serialitza una línia Prisma al contracte del motor de repartiment. */
function toCrewLine(
  l: { id: string; collaboratorId: string | null; kind: CrewLineInput['kind']; label: string; revenueAmount: number | null; costAmount: number | null; quantity: number | null; hours: number | null },
  ctx: { origin: 'lead' | 'booking'; parentId: string; parentRef: string; eventDate: Date | null; eventStartTime: string | null; eventEndTime: string | null; eventLocation: string | null },
): CrewLineInput {
  return {
    lineId: l.id, origin: ctx.origin, parentId: ctx.parentId, parentRef: ctx.parentRef,
    collaboratorId: l.collaboratorId, kind: l.kind, label: l.label,
    revenueAmount: l.revenueAmount, costAmount: l.costAmount, quantity: l.quantity, hours: l.hours,
    eventDate: ctx.eventDate, eventStartTime: ctx.eventStartTime, eventEndTime: ctx.eventEndTime, eventLocation: ctx.eventLocation,
  };
}

/**
 * Construeix la pasta d'un col·laborador. Carrega tots els bolos (lead + booking)
 * on participa, reparteix cada bolo sencer amb el motor canònic i n'agafa la seva part.
 */
export async function loadCollaboratorPayout(collaboratorId: string): Promise<CollaboratorPayoutSummary | null> {
  const collaborator = await prisma.collaborator.findUnique({
    where: { id: collaboratorId },
    select: { id: true, name: true },
  });
  if (!collaborator) return null;

  // Bolos (leads + bookings) on el col·laborador té almenys una línia. Carreguem
  // TOTES les línies del bolo (el motor necessita el bolo sencer per repartir bé).
  const [leads, bookings, payments] = await Promise.all([
    prisma.lead.findMany({
      where: {
        status: { in: [...LEAD_STATUSES_ACTIVE] },
        booking: null, // lead pur (si té reserva, el bolo viu com a booking)
        serviceLines: { some: { collaboratorId } },
      },
      select: {
        id: true, name: true, eventDate: true, eventStartTime: true, eventEndTime: true, eventLocation: true, distanceKm: true,
        serviceLines: { select: { id: true, collaboratorId: true, kind: true, label: true, revenueAmount: true, costAmount: true, quantity: true, hours: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: [...BOOKING_STATUSES_ACTIVE] },
        serviceLines: { some: { collaboratorId } },
      },
      select: {
        id: true, reference: true, clientName: true, eventDate: true, eventStartTime: true, eventEndTime: true, eventLocation: true, distanceKm: true,
        serviceLines: { select: { id: true, collaboratorId: true, kind: true, label: true, revenueAmount: true, costAmount: true, quantity: true, hours: true } },
      },
    }),
    prisma.collaboratorPayment.findMany({
      where: { collaboratorId },
      select: { id: true, bookingId: true, leadId: true, amount: true, paidAt: true, method: true },
    }),
  ]);

  // Index de pagaments per bolo (bookingId o leadId).
  const paidByParent = new Map<string, { id: string; paidAt: Date; method: string }>();
  for (const p of payments) {
    const key = p.bookingId ?? p.leadId;
    if (key) paidByParent.set(key, { id: p.id, paidAt: p.paidAt, method: p.method });
  }

  const now = new Date();
  const bolos: CollaboratorPayoutBolo[] = [];

  const pushBolo = (
    origin: 'lead' | 'booking',
    parentId: string,
    parentRef: string,
    ctx: { eventDate: Date | null; eventStartTime: string | null; eventEndTime: string | null; eventLocation: string | null; distanceKm: number | null },
    lines: CrewLineInput[],
  ) => {
    const repartiment = computeBoloRepartiment(lines);
    const mine = repartiment.perPersona.find((p) => !p.esOrbita && p.personId === collaboratorId);
    const amount = round2(mine?.rep ?? 0);
    if (amount <= 0) return; // no hi ha import positiu a pagar-li en aquest bolo
    const payment = paidByParent.get(parentId);
    const isFuture = ctx.eventDate ? ctx.eventDate.getTime() > now.getTime() : false;
    const status: PayoutBoloStatus = payment ? 'PAGAT' : isFuture ? 'PREVI' : 'ENTREGAT';
    bolos.push({
      origin, parentId, parentRef,
      dateKey: ctx.eventDate ? toDateKey(ctx.eventDate) : null,
      eventDate: ctx.eventDate, status, amount,
      paidAt: payment ? payment.paidAt.toISOString() : null,
      paymentId: payment?.id ?? null,
      paymentMethod: payment?.method ?? null,
      eventStartTime: ctx.eventStartTime,
      eventEndTime: ctx.eventEndTime,
      eventLocation: ctx.eventLocation,
      jornada: computeJornada({ eventStartTime: ctx.eventStartTime, eventEndTime: ctx.eventEndTime, roundTripKm: ctx.distanceKm }),
    });
  };

  for (const lead of leads) {
    const ctx = { eventDate: lead.eventDate, eventStartTime: lead.eventStartTime, eventEndTime: lead.eventEndTime, eventLocation: lead.eventLocation, distanceKm: lead.distanceKm };
    const lines = lead.serviceLines.map((l) => toCrewLine(l, { origin: 'lead', parentId: lead.id, parentRef: lead.name, ...ctx }));
    pushBolo('lead', lead.id, lead.name, ctx, lines);
  }
  for (const bk of bookings) {
    const ctx = { eventDate: bk.eventDate, eventStartTime: bk.eventStartTime, eventEndTime: bk.eventEndTime, eventLocation: bk.eventLocation, distanceKm: bk.distanceKm };
    const lines = bk.serviceLines.map((l) => toCrewLine(l, { origin: 'booking', parentId: bk.id, parentRef: bk.clientName || bk.reference, ...ctx }));
    pushBolo('booking', bk.id, bk.clientName || bk.reference, ctx, lines);
  }

  // Ordena per data (més recent a dalt).
  bolos.sort((a, b) => (b.dateKey ?? '').localeCompare(a.dateKey ?? ''));

  // Totals per estat.
  const totals = { previ: 0, aPagar: 0, pagat: 0 };
  const monthMap = new Map<string, CollaboratorPayoutMonth>();
  for (const b of bolos) {
    if (b.status === 'PREVI') totals.previ = round2(totals.previ + b.amount);
    else if (b.status === 'ENTREGAT') totals.aPagar = round2(totals.aPagar + b.amount);
    else totals.pagat = round2(totals.pagat + b.amount);

    const month = b.dateKey ? b.dateKey.slice(0, 7) : 'sense-data';
    const m = monthMap.get(month) ?? { month, previ: 0, aPagar: 0, pagat: 0 };
    if (b.status === 'PREVI') m.previ = round2(m.previ + b.amount);
    else if (b.status === 'ENTREGAT') m.aPagar = round2(m.aPagar + b.amount);
    else m.pagat = round2(m.pagat + b.amount);
    monthMap.set(month, m);
  }

  const months = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  return {
    collaboratorId: collaborator.id,
    collaboratorName: collaborator.name,
    totals,
    bolos,
    months,
  };
}

/** Registra un pagament a un col·laborador per un bolo (per defecte: avui, cash). */
export async function recordCollaboratorPayment(input: {
  collaboratorId: string;
  bookingId?: string | null;
  leadId?: string | null;
  amount: number;
  method?: string | null;
  paidAt?: string | null;
  notes?: string | null;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const amount = Number(input.amount);
  if (!input.collaboratorId || !Number.isFinite(amount) || amount <= 0) {
    return { status: 400, body: { error: 'Falten col·laborador o import vàlid' } };
  }
  if (!input.bookingId && !input.leadId) {
    return { status: 400, body: { error: 'Falta el bolo (bookingId o leadId)' } };
  }
  const payment = await prisma.collaboratorPayment.create({
    data: {
      collaboratorId: input.collaboratorId,
      bookingId: input.bookingId?.trim() || null,
      leadId: input.leadId?.trim() || null,
      amount: round2(amount),
      method: (input.method?.trim() || 'CASH').toUpperCase(),
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      notes: input.notes?.trim() || null,
    },
  });
  return { status: 201, body: { ok: true, payment } };
}

/** Elimina un pagament (desfer «marcar pagat»). */
export async function deleteCollaboratorPayment(id: string): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!id) return { status: 400, body: { error: 'Falta id' } };
  await prisma.collaboratorPayment.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}
