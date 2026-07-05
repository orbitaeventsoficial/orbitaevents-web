// lib/services/dayCollisionService.ts
// ═══════════════════════════════════════════════════════════════════════════
// GUÀRDIA DE DISSABTES — detecta DIES amb 2+ bolos compromesos
// El recurs escàs del negoci és el temps (els ~50 dissabtes l'any): no pots ser
// a dos llocs alhora. Aquesta guàrdia avisa (no bloqueja) quan un mateix dia té
// més d'una reserva activa, perquè el propietari confirmi que està cobert (crew /
// col·laborador) abans de comprometre'n una altra. Diferent del `capacityConflict`
// (que mira STOCK d'inventari); això mira PRESÈNCIA humana.
// Part pura (`detectDayCollisions`) + wrapper Prisma (`loadDayCollisions`).
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';

const DAY_MS = 1000 * 60 * 60 * 24;

export type DayCollisionBooking = {
  bookingId: string;
  reference: string;
  clientName: string;
  eventStartTime: string | null;
  eventLocation: string | null;
};

export type DayCollision = {
  date: string; // YYYY-MM-DD
  weekday: number; // 0=diu … 6=dis
  isWeekend: boolean;
  count: number;
  bookings: DayCollisionBooking[];
};

export type DayCollisionInput = {
  id: string;
  reference: string;
  clientName: string;
  eventDate: Date;
  eventStartTime: string | null;
  eventLocation: string | null;
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Pura i determinista: agrupa les reserves per dia i retorna els dies amb 2+
 * bolos, ordenats per data ascendent. Marca si el dia és cap de setmana.
 */
export function detectDayCollisions(bookings: DayCollisionInput[]): DayCollision[] {
  const byDay = new Map<string, DayCollisionInput[]>();
  for (const b of bookings) {
    const key = toDateKey(b.eventDate);
    const arr = byDay.get(key) ?? [];
    arr.push(b);
    byDay.set(key, arr);
  }

  const collisions: DayCollision[] = [];
  for (const [date, items] of byDay) {
    if (items.length < 2) continue;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    collisions.push({
      date,
      weekday,
      isWeekend: weekday === 0 || weekday === 6,
      count: items.length,
      bookings: items
        .sort((a, b) => (a.eventStartTime ?? '').localeCompare(b.eventStartTime ?? ''))
        .map((b) => ({
          bookingId: b.id,
          reference: b.reference,
          clientName: b.clientName,
          eventStartTime: b.eventStartTime,
          eventLocation: b.eventLocation,
        })),
    });
  }

  return collisions.sort((a, b) => a.date.localeCompare(b.date));
}

/** Wrapper amb I/O: carrega les reserves compromeses futures i en detecta col·lisions. */
export async function loadDayCollisions(windowDays = 90, now: Date = new Date()): Promise<DayCollision[]> {
  const from = new Date(now.getTime());
  const to = new Date(now.getTime() + windowDays * DAY_MS);
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      eventDate: { gte: from, lte: to },
    },
    select: {
      id: true,
      reference: true,
      clientName: true,
      eventDate: true,
      eventStartTime: true,
      eventLocation: true,
    },
    orderBy: { eventDate: 'asc' },
  });
  return detectDayCollisions(bookings);
}
