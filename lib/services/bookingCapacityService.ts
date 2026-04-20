// lib/services/bookingCapacityService.ts
// ═══════════════════════════════════════════════════════════════════════════
// BOOKING CAPACITY SERVICE
// Visió global de càrrega operativa per dia: events confirmats, capacitat,
// col·lisions, disponibilitat. Funció pura + wrapper.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type DayLoadLevel = 'FREE' | 'LIGHT' | 'FULL' | 'OVERLOADED';

export type DayCapacity = {
  date: string;
  dayOfWeek: number;
  bookings: DayBooking[];
  count: number;
  totalGuests: number;
  loadLevel: DayLoadLevel;
  isWeekend: boolean;
};

export type DayBooking = {
  id: string;
  clientName: string;
  eventType: string;
  eventLocation: string;
  guestCount: number;
  status: string;
  startTime: string | null;
  endTime: string | null;
  packSlug: string | null;
};

export type WeekCapacity = {
  weekStart: string;
  weekEnd: string;
  days: DayCapacity[];
  totalBookings: number;
  busiestDay: string | null;
  freeCount: number;
  overloadedCount: number;
};

export type BookingCapacityRaw = {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: Date;
  eventLocation: string;
  guestCount: number;
  status: string;
  eventStartTime: string | null;
  eventEndTime: string | null;
  packSlug: string | null;
};

export type BookingCapacityInput = {
  bookings: BookingCapacityRaw[];
  startDate: Date;
  days: number;
  maxPerDay?: number;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_PER_DAY = 2;

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function buildWeekCapacity(input: BookingCapacityInput): WeekCapacity {
  const { bookings, startDate, days, maxPerDay = DEFAULT_MAX_PER_DAY } = input;

  // Build date-keyed map (normalize to local date string YYYY-MM-DD)
  const byDate = new Map<string, BookingCapacityRaw[]>();
  for (const b of bookings) {
    const d = b.eventDate;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(b);
  }

  const dayCapacities: DayCapacity[] = [];
  let totalBookings = 0;
  let busiestDay: string | null = null;
  let busiestCount = 0;
  let freeCount = 0;
  let overloadedCount = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayBookings = byDate.get(dateStr) ?? [];
    const count = dayBookings.length;
    const totalGuests = dayBookings.reduce((sum, b) => sum + b.guestCount, 0);

    let loadLevel: DayLoadLevel;
    if (count === 0) {
      loadLevel = 'FREE';
      freeCount++;
    } else if (count < maxPerDay) {
      loadLevel = 'LIGHT';
    } else if (count === maxPerDay) {
      loadLevel = 'FULL';
    } else {
      loadLevel = 'OVERLOADED';
      overloadedCount++;
    }

    totalBookings += count;
    if (count > busiestCount) {
      busiestCount = count;
      busiestDay = dateStr;
    }

    dayCapacities.push({
      date: dateStr,
      dayOfWeek,
      bookings: dayBookings.map((b) => ({
        id: b.id,
        clientName: b.clientName,
        eventType: b.eventType,
        eventLocation: b.eventLocation,
        guestCount: b.guestCount,
        status: b.status,
        startTime: b.eventStartTime,
        endTime: b.eventEndTime,
        packSlug: b.packSlug,
      })),
      count,
      totalGuests,
      loadLevel,
      isWeekend,
    });
  }

  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + days - 1);
  const weekStartStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  const weekEndStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    days: dayCapacities,
    totalBookings,
    busiestDay,
    freeCount,
    overloadedCount,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadWeekCapacity(
  startDate: Date = new Date(),
  days: number = 14,
): Promise<WeekCapacity> {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);

  const rows = await prisma.booking.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
      eventDate: { gte: start, lt: end },
    },
    select: {
      id: true,
      clientName: true,
      eventType: true,
      eventDate: true,
      eventLocation: true,
      guestCount: true,
      status: true,
      eventStartTime: true,
      eventEndTime: true,
      pack: { select: { slug: true } },
    },
    orderBy: { eventDate: 'asc' },
  });

  const bookings: BookingCapacityRaw[] = rows.map((r) => ({
    id: r.id,
    clientName: r.clientName,
    eventType: r.eventType,
    eventDate: r.eventDate,
    eventLocation: r.eventLocation ?? '',
    guestCount: r.guestCount,
    status: r.status,
    eventStartTime: r.eventStartTime,
    eventEndTime: r.eventEndTime,
    packSlug: r.pack?.slug ?? null,
  }));

  return buildWeekCapacity({ bookings, startDate: start, days });
}
