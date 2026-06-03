import { prisma } from '@/lib/prisma';

// ─── Raw input types (de la BD) ──────────────────────────────────────────────

// Enllaç a la reserva convertida d'un lead guanyat (relació 1-a-1 via booking.leadId).
// Permet distingir al calendari "guanyat sense reserva" de "reserva" + semàfor de cobrament.
export interface SeasonCalendarBookingLink {
  id: string;
  reference: string;
  status: string;
  depositPaid: boolean;
  remainingPaid: boolean;
}

export interface SeasonCalendarLeadRaw {
  id: string;
  status: string;
  name: string;
  eventDate: Date | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventType: string | null;
  eventLocation: string | null;
  guestCount: number | null;
  estimatedValue: number | null;
  lostReason: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  assignedTo: string | null;
  contactedAt: Date | null;
  priority: string | null;
  booking: SeasonCalendarBookingLink | null;
}

export interface SeasonCalendarBookingRaw {
  id: string;
  status: string;
  clientName: string;
  eventDate: Date;
  eventType: string | null;
  eventLocation: string | null;
  guestCount: number | null;
  total: number;
}

export interface SeasonCalendarInput {
  windowStart: Date;
  months: number;
  leads: SeasonCalendarLeadRaw[];
  bookings: SeasonCalendarBookingRaw[];
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface SeasonCalendarEntry {
  id: string;
  type: 'lead' | 'booking';
  status: string;
  name: string;
  eventDate: Date | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventType: string | null;
  eventLocation: string | null;
  guestCount: number | null;
  estimatedValue: number | null;
  lostReason: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  assignedTo: string | null;
  contactedAt: Date | null;
  priority: string | null;
  booking: SeasonCalendarBookingLink | null;
}

export interface SeasonWeekend {
  weekKey: string;        // 'YYYY-MM-DD' of the Friday
  fri: Date;
  sat: Date;
  sun: Date;
  entries: SeasonCalendarEntry[];
  totalValue: number;
}

export interface SeasonCalendarResult {
  windowStart: Date;
  windowEnd: Date;
  weekends: SeasonWeekend[];
  weekdays: SeasonCalendarEntry[];   // Entrades amb data Dl–Dj, no capturades per cap cap de setmana
  unscheduled: SeasonCalendarEntry[];
  stats: {
    totalLeads: number;
    totalBookings: number;
    scheduledLeads: number;
    scheduledBookings: number;
    totalValue: number;
  };
}

// ─── Helpers purs ─────────────────────────────────────────────────────────────

// Parseja el camp `budget` del lead (string lliure: "300", "300€", "300 EUR", "1.200",
// "1,200", "1.200,50") en un nombre. Retorna null si no es pot extreure cap xifra.
// Acceptat tant punt com coma com a separador decimal/miler — pren el darrer com a
// decimal si hi ha 2 dígits darrere.
export function parseBudgetAmount(budget: string | null | undefined): number | null {
  if (!budget) return null;
  const digits = budget.replace(/[^\d.,]/g, '');
  if (!digits) return null;
  const lastDot = digits.lastIndexOf('.');
  const lastComma = digits.lastIndexOf(',');
  let normalized = digits;
  if (lastDot > -1 && lastComma > -1) {
    // Format europeu o americà mixt — el darrer separador és el decimal.
    if (lastComma > lastDot) normalized = digits.replace(/\./g, '').replace(',', '.');
    else normalized = digits.replace(/,/g, '');
  } else if (lastComma > -1) {
    // Si hi ha 1-2 dígits després de la coma, és decimal; si no, miler.
    const after = digits.length - lastComma - 1;
    normalized = after > 0 && after <= 2 ? digits.replace(',', '.') : digits.replace(/,/g, '');
  } else if (lastDot > -1) {
    const after = digits.length - lastDot - 1;
    normalized = after > 0 && after <= 2 ? digits : digits.replace(/\./g, '');
  }
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ─── Date helpers (UTC-aware, sense dependències externes) ────────────────────

function startOfDayUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addMonthsUtc(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDayUtc(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

// Obté tots els caps de setmana (Dv+Ds+Dg) dins la finestra
function getWeekendsInWindow(
  windowStart: Date,
  windowEnd: Date,
): Array<{ fri: Date; sat: Date; sun: Date; weekKey: string }> {
  const result: Array<{ fri: Date; sat: Date; sun: Date; weekKey: string }> = [];

  // Trobar el primer divendres (5) a partir de windowStart
  let fri = startOfDayUtc(windowStart);
  while (fri.getUTCDay() !== 5) {
    fri = new Date(fri.getTime() + 86400000);
  }

  while (fri < windowEnd) {
    const sat = new Date(fri.getTime() + 86400000);
    const sun = new Date(fri.getTime() + 2 * 86400000);
    result.push({
      fri: new Date(fri),
      sat,
      sun,
      weekKey: toDateKey(fri),
    });
    fri = new Date(fri.getTime() + 7 * 86400000);
  }

  return result;
}

// ─── Funció pura (testejable sense I/O) ──────────────────────────────────────

export function buildSeasonCalendar(input: SeasonCalendarInput): SeasonCalendarResult {
  const windowStart = startOfDayUtc(input.windowStart);
  const windowEnd = startOfDayUtc(addMonthsUtc(windowStart, input.months));

  const weekends = getWeekendsInWindow(windowStart, windowEnd);

  const scheduled: SeasonCalendarEntry[] = [];
  const unscheduled: SeasonCalendarEntry[] = [];

  for (const lead of input.leads) {
    const entry: SeasonCalendarEntry = {
      id: lead.id,
      type: 'lead',
      status: lead.status,
      name: lead.name,
      eventDate: lead.eventDate,
      eventStartTime: lead.eventStartTime ?? null,
      eventEndTime: lead.eventEndTime ?? null,
      eventType: lead.eventType,
      eventLocation: lead.eventLocation,
      guestCount: lead.guestCount,
      estimatedValue: lead.estimatedValue,
      lostReason: lead.lostReason,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      assignedTo: lead.assignedTo,
      contactedAt: lead.contactedAt,
      priority: lead.priority,
      booking: lead.booking,
    };
    if (lead.eventDate) {
      scheduled.push(entry);
    } else {
      unscheduled.push(entry);
    }
  }

  for (const booking of input.bookings) {
    scheduled.push({
      id: booking.id,
      type: 'booking',
      status: booking.status,
      name: booking.clientName,
      eventDate: booking.eventDate,
      eventStartTime: null,
      eventEndTime: null,
      eventType: booking.eventType,
      eventLocation: booking.eventLocation,
      guestCount: booking.guestCount,
      estimatedValue: booking.total,
      lostReason: null,
      phone: null,
      email: null,
      source: null,
      assignedTo: null,
      contactedAt: null,
      priority: null,
      booking: null,
    });
  }

  const weekendResults: SeasonWeekend[] = weekends.map((w) => {
    const entries = scheduled.filter((e) => {
      const d = startOfDayUtc(e.eventDate as Date);
      return isSameDayUtc(d, w.fri) || isSameDayUtc(d, w.sat) || isSameDayUtc(d, w.sun);
    });
    const totalValue = entries.reduce((sum, e) => sum + (e.estimatedValue ?? 0), 0);
    return { ...w, entries, totalValue };
  });

  const weekendEntryIds = new Set(weekendResults.flatMap((w) => w.entries.map((e) => e.id)));
  const weekdays = scheduled.filter((e) => !weekendEntryIds.has(e.id));

  const scheduledLeads = input.leads.filter((l) => l.eventDate !== null).length;
  const scheduledBookings = input.bookings.length;
  const allScheduledEntries = [...scheduled];
  const totalValue = allScheduledEntries.reduce((sum, e) => sum + (e.estimatedValue ?? 0), 0);

  return {
    windowStart,
    windowEnd,
    weekends: weekendResults,
    weekdays,
    unscheduled,
    stats: {
      totalLeads: input.leads.length,
      totalBookings: input.bookings.length,
      scheduledLeads,
      scheduledBookings,
      totalValue,
    },
  };
}

// ─── Wrapper amb Prisma ───────────────────────────────────────────────────────

export async function loadSeasonCalendar(
  windowStart: Date,
  months: number,
): Promise<SeasonCalendarResult> {
  const start = startOfDayUtc(windowStart);
  const end = startOfDayUtc(addMonthsUtc(start, months));

  const [leads, bookings] = await Promise.all([
    prisma.lead.findMany({
      where: {
        OR: [
          // qualsevol lead amb data dins la finestra (inclou LOST visibles al pipeline)
          { eventDate: { gte: start, lt: end } },
          // unscheduled: sense data i NO perduts (els LOST sense data no es mostren)
          { eventDate: null, status: { notIn: ['LOST'] } },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        eventDate: true,
        eventStartTime: true,
        eventEndTime: true,
        eventType: true,
        eventLocation: true,
        guestCount: true,
        budget: true,
        lostReason: true,
        phone: true,
        email: true,
        source: true,
        assignedTo: true,
        contactedAt: true,
        priority: true,
        proposals: {
          where: { status: { in: ['SENT', 'ACCEPTED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { total: true },
        },
        booking: {
          // Si hi ha booking, el seu `total` és la veritat del valor del bolo.
          select: { id: true, reference: true, status: true, depositPaid: true, remainingPaid: true, total: true },
        },
      },
      orderBy: { eventDate: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        eventDate: { gte: start, lt: end },
      },
      select: {
        id: true,
        clientName: true,
        status: true,
        eventDate: true,
        eventType: true,
        eventLocation: true,
        guestCount: true,
        total: true,
      },
      orderBy: { eventDate: 'asc' },
    }),
  ]);

  return buildSeasonCalendar({
    windowStart: start,
    months,
    leads: leads.map((l) => ({
      id: l.id,
      name: l.name,
      status: l.status,
      eventDate: l.eventDate,
      eventStartTime: l.eventStartTime ?? null,
      eventEndTime: l.eventEndTime ?? null,
      eventType: l.eventType as string | null,
      eventLocation: l.eventLocation,
      guestCount: l.guestCount,
      // Cascada de valor: total de la reserva (si existeix) → total de proposal SENT/ACCEPTED
      // → budget del lead parsejat (string lliure tipus "300" o "300€"). Si tot és null,
      // el lead no compta cap a la suma de Valor temporada.
      estimatedValue: l.booking?.total ?? l.proposals[0]?.total ?? parseBudgetAmount(l.budget),
      lostReason: l.lostReason,
      phone: l.phone,
      email: l.email,
      source: l.source,
      assignedTo: l.assignedTo,
      contactedAt: l.contactedAt,
      priority: l.priority as string | null,
      booking: l.booking
        ? {
            id: l.booking.id,
            reference: l.booking.reference,
            status: l.booking.status,
            depositPaid: l.booking.depositPaid,
            remainingPaid: l.booking.remainingPaid,
          }
        : null,
    })),
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      clientName: b.clientName,
      eventDate: b.eventDate,
      eventType: b.eventType as string | null,
      eventLocation: b.eventLocation,
      guestCount: b.guestCount,
      total: b.total,
    })),
  });
}
