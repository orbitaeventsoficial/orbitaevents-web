import { prisma } from '@/lib/prisma';
import { CAPACITY_FORECAST_THRESHOLDS } from '@/lib/constants/automationThresholds';

export type WeekAlertLevel = 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL';

export type WeeklyCapacityForecast = {
  weekStart: string;
  weekEnd: string;
  bookingsCount: number;
  totalGuests: number;
  overloadedDays: number;
  previousYearBookings: number;
  yoyDelta: number | null;
  alertLevel: WeekAlertLevel;
  alertMessage: string | null;
};

export type ForecastBookingRaw = {
  id: string;
  eventDate: Date;
  guestCount: number;
};

export type WeeklyCapacityForecastInput = {
  upcomingBookings: ForecastBookingRaw[];
  previousYearBookings: ForecastBookingRaw[];
  now: Date;
  weeksAhead: number;
  maxBookingsPerDay: number;
  warningThreshold: number;
  criticalThreshold: number;
};

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function countOverloadedDays(bookings: ForecastBookingRaw[], maxBookingsPerDay: number): number {
  const byDay = new Map<string, number>();
  for (const b of bookings) {
    const key = formatDate(b.eventDate);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  let overloaded = 0;
  for (const count of byDay.values()) {
    if (count > maxBookingsPerDay) overloaded += 1;
  }
  return overloaded;
}

function classifyAlert(
  bookingsCount: number,
  overloadedDays: number,
  warningThreshold: number,
  criticalThreshold: number,
): { level: WeekAlertLevel; message: string | null } {
  if (overloadedDays > 0 || bookingsCount >= criticalThreshold) {
    const overloadHint = overloadedDays > 0 ? ` (${overloadedDays} dies sobrecarregats)` : '';
    return { level: 'CRITICAL', message: `Setmana sobrecarregada: ${bookingsCount} reserves${overloadHint}.` };
  }
  if (bookingsCount >= warningThreshold) {
    return { level: 'WARNING', message: `Setmana intensa: ${bookingsCount} reserves. Vigilar capacitat.` };
  }
  if (bookingsCount > 0) {
    return { level: 'INFO', message: `${bookingsCount} reserves planificades.` };
  }
  return { level: 'NONE', message: null };
}

export function buildWeeklyCapacityForecast(input: WeeklyCapacityForecastInput): WeeklyCapacityForecast[] {
  const { upcomingBookings, previousYearBookings, now, weeksAhead, maxBookingsPerDay, warningThreshold, criticalThreshold } = input;
  const firstWeekStart = startOfWeek(now);

  const upcomingByWeekIndex = new Map<number, ForecastBookingRaw[]>();
  for (const b of upcomingBookings) {
    const offsetMs = b.eventDate.getTime() - firstWeekStart.getTime();
    const weekIndex = Math.floor(offsetMs / (7 * DAY_MS));
    if (weekIndex < 0 || weekIndex >= weeksAhead) continue;
    const list = upcomingByWeekIndex.get(weekIndex) ?? [];
    list.push(b);
    upcomingByWeekIndex.set(weekIndex, list);
  }

  const previousYearAnchor = new Date(firstWeekStart.getFullYear() - 1, firstWeekStart.getMonth(), firstWeekStart.getDate());
  const previousByWeekIndex = new Map<number, number>();
  for (const b of previousYearBookings) {
    const offsetMs = b.eventDate.getTime() - previousYearAnchor.getTime();
    const weekIndex = Math.floor(offsetMs / (7 * DAY_MS));
    if (weekIndex < 0 || weekIndex >= weeksAhead) continue;
    previousByWeekIndex.set(weekIndex, (previousByWeekIndex.get(weekIndex) ?? 0) + 1);
  }

  const result: WeeklyCapacityForecast[] = [];
  for (let i = 0; i < weeksAhead; i++) {
    const start = new Date(firstWeekStart.getFullYear(), firstWeekStart.getMonth(), firstWeekStart.getDate() + i * 7);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    const weekBookings = upcomingByWeekIndex.get(i) ?? [];
    const bookingsCount = weekBookings.length;
    const totalGuests = weekBookings.reduce((sum, b) => sum + (b.guestCount ?? 0), 0);
    const overloadedDays = countOverloadedDays(weekBookings, maxBookingsPerDay);
    const previousYearBookingsCount = previousByWeekIndex.get(i) ?? 0;
    const yoyDelta = previousYearBookingsCount > 0
      ? (bookingsCount - previousYearBookingsCount) / previousYearBookingsCount
      : null;
    const { level, message } = classifyAlert(bookingsCount, overloadedDays, warningThreshold, criticalThreshold);

    result.push({
      weekStart: formatDate(start),
      weekEnd: formatDate(end),
      bookingsCount,
      totalGuests,
      overloadedDays,
      previousYearBookings: previousYearBookingsCount,
      yoyDelta,
      alertLevel: level,
      alertMessage: message,
    });
  }

  return result;
}

export async function loadWeeklyCapacityForecast(
  now: Date = new Date(),
  weeksAhead: number = CAPACITY_FORECAST_THRESHOLDS.defaultWeeksAhead,
  options: { maxBookingsPerDay?: number; warningThreshold?: number; criticalThreshold?: number } = {},
): Promise<WeeklyCapacityForecast[]> {
  const maxBookingsPerDay = options.maxBookingsPerDay ?? CAPACITY_FORECAST_THRESHOLDS.maxBookingsPerDay;
  const warningThreshold = options.warningThreshold ?? CAPACITY_FORECAST_THRESHOLDS.weekWarningBookings;
  const criticalThreshold = options.criticalThreshold ?? CAPACITY_FORECAST_THRESHOLDS.weekCriticalBookings;

  const firstWeekStart = startOfWeek(now);
  const forecastEnd = new Date(firstWeekStart.getFullYear(), firstWeekStart.getMonth(), firstWeekStart.getDate() + weeksAhead * 7);

  const previousYearStart = new Date(firstWeekStart.getFullYear() - 1, firstWeekStart.getMonth(), firstWeekStart.getDate());
  const previousYearEnd = new Date(previousYearStart.getFullYear(), previousYearStart.getMonth(), previousYearStart.getDate() + weeksAhead * 7);

  const [upcoming, previous] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'PENDING'] },
        eventDate: { gte: firstWeekStart, lt: forecastEnd },
      },
      select: { id: true, eventDate: true, guestCount: true },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] },
        eventDate: { gte: previousYearStart, lt: previousYearEnd },
      },
      select: { id: true, eventDate: true, guestCount: true },
    }),
  ]);

  return buildWeeklyCapacityForecast({
    upcomingBookings: upcoming,
    previousYearBookings: previous,
    now,
    weeksAhead,
    maxBookingsPerDay,
    warningThreshold,
    criticalThreshold,
  });
}
