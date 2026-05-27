import { prisma } from '@/lib/prisma';

// ─── Raw input types (de la BD) ──────────────────────────────────────────────

export interface SeasonCalendarLeadRaw {
  id: string;
  status: string;
  name: string;
  eventDate: Date | null;
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
  unscheduled: SeasonCalendarEntry[];
  stats: {
    totalLeads: number;
    totalBookings: number;
    scheduledLeads: number;
    scheduledBookings: number;
    totalValue: number;
  };
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

  const scheduledLeads = input.leads.filter((l) => l.eventDate !== null).length;
  const scheduledBookings = input.bookings.length;
  const allScheduledEntries = [...scheduled];
  const totalValue = allScheduledEntries.reduce((sum, e) => sum + (e.estimatedValue ?? 0), 0);

  return {
    windowStart,
    windowEnd,
    weekends: weekendResults,
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
        eventType: true,
        eventLocation: true,
        guestCount: true,
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
      eventType: l.eventType as string | null,
      eventLocation: l.eventLocation,
      guestCount: l.guestCount,
      estimatedValue: l.proposals[0]?.total ?? null,
      lostReason: l.lostReason,
      phone: l.phone,
      email: l.email,
      source: l.source,
      assignedTo: l.assignedTo,
      contactedAt: l.contactedAt,
      priority: l.priority as string | null,
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
