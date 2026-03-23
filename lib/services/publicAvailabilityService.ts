import { PUBLIC_CALENDAR_MONTH_NAMES, type PublicCalendarLocale } from '@/lib/constants/index';
import { prisma } from '@/lib/prisma';

export type AvailabilityDateStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
export type AvailabilityLocale = PublicCalendarLocale;

function getSaturdaysOfMonth(year: number, month: number): Date[] {
  const saturdays: Date[] = [];
  const date = new Date(year, month, 1);

  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }

  while (date.getMonth() === month) {
    saturdays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }

  return saturdays;
}

function toIsoDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMonthName(month: number, locale: AvailabilityLocale): string {
  return PUBLIC_CALENDAR_MONTH_NAMES[locale][month];
}

function getScarcityMessage(
  locale: AvailabilityLocale,
  monthName: string,
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
  availableSaturdays: number
) {
  if (locale === 'en') {
    if (urgencyLevel === 'critical') return `${monthName}: SOLD OUT!`;
    if (urgencyLevel === 'high') return `${monthName}: Last date!`;
    if (urgencyLevel === 'medium') return `${monthName}: ${availableSaturdays} Saturdays left`;
    return `${monthName}: ${availableSaturdays} Saturdays available`;
  }

  if (locale === 'ca') {
    if (urgencyLevel === 'critical') return `${monthName}: COMPLET!`;
    if (urgencyLevel === 'high') return `${monthName}: Darrera data!`;
    if (urgencyLevel === 'medium') return `${monthName}: queden ${availableSaturdays} dissabtes`;
    return `${monthName}: ${availableSaturdays} dissabtes disponibles`;
  }

  if (urgencyLevel === 'critical') return `${monthName}: ¡COMPLETO!`;
  if (urgencyLevel === 'high') return `${monthName}: ¡Última fecha!`;
  if (urgencyLevel === 'medium') return `${monthName}: quedan ${availableSaturdays} sábados`;
  return `${monthName}: ${availableSaturdays} sábados disponibles`;
}

export function generateFallbackPublicAvailability(locale: AvailabilityLocale) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const nextSaturday = new Date(now);
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  nextSaturday.setDate(now.getDate() + Math.max(daysUntilSaturday, 7));
  const currentMonthName = getMonthName(currentMonth, locale);

  return {
    ok: true,
    data: {
      nextAvailableDate: nextSaturday.toISOString().slice(0, 10),
      nextAvailableSaturday: nextSaturday.toISOString().slice(0, 10),
      monthlyAvailability: [{
        month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        monthName: getMonthName(currentMonth, locale),
        year: currentYear,
        totalSaturdays: 4,
        availableSaturdays: 2,
        bookedSaturdays: 2,
        blockedSaturdays: 0,
        saturdayDates: [],
      }],
      scarcityMessage: getScarcityMessage(locale, currentMonthName, 'medium', 2),
      urgencyLevel: 'medium' as const,
    },
    generatedAt: new Date().toISOString(),
    source: 'fallback' as const,
  };
}

export async function listAvailabilityRange(from: Date, to: Date) {
  const availability = await prisma.availability.findMany({
    where: {
      date: {
        gte: from,
        lte: to,
      },
    },
    select: {
      date: true,
      status: true,
      note: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  const dates = availability.map((item) => ({
    date: item.date.toISOString().split('T')[0],
    status: item.status as AvailabilityDateStatus,
    note: item.note || undefined,
  }));

  return {
    dates,
    summary: {
      total: dates.length,
      available: dates.filter((date) => date.status === 'AVAILABLE').length,
      booked: dates.filter((date) => date.status === 'BOOKED').length,
      blocked: dates.filter((date) => date.status === 'BLOCKED').length,
    },
  };
}

export async function buildPublicAvailability(locale: AvailabilityLocale) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthsToCheck = 4;
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + monthsToCheck, 0);

  const [bookings, blockedDates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING'],
        },
      },
      select: {
        eventDate: true,
      },
    }),
    prisma.availability.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'BLOCKED',
      },
      select: {
        date: true,
      },
    }),
  ]);

  const bookedDatesSet = new Set(bookings.map((booking) => toIsoDateString(booking.eventDate)));
  const blockedDatesSet = new Set(blockedDates.map((entry) => toIsoDateString(entry.date)));

  const monthlyAvailability = [];
  let nextAvailableSaturday: string | null = null;

  for (let i = 0; i < monthsToCheck; i += 1) {
    const checkMonth = currentMonth + i;
    const checkYear = currentYear + Math.floor(checkMonth / 12);
    const normalizedMonth = checkMonth % 12;
    const saturdays = getSaturdaysOfMonth(checkYear, normalizedMonth);
    const futureSaturdays = saturdays.filter((saturday) => saturday > now);

    const saturdayDates = futureSaturdays.map((saturday) => {
      const date = toIsoDateString(saturday);
      let status: 'available' | 'booked' | 'blocked' = 'available';

      if (bookedDatesSet.has(date)) {
        status = 'booked';
      } else if (blockedDatesSet.has(date)) {
        status = 'blocked';
      } else if (!nextAvailableSaturday) {
        nextAvailableSaturday = date;
      }

      return { date, status };
    });

    monthlyAvailability.push({
      month: `${checkYear}-${String(normalizedMonth + 1).padStart(2, '0')}`,
      monthName: getMonthName(normalizedMonth, locale),
      year: checkYear,
      totalSaturdays: futureSaturdays.length,
      availableSaturdays: saturdayDates.filter((entry) => entry.status === 'available').length,
      bookedSaturdays: saturdayDates.filter((entry) => entry.status === 'booked').length,
      blockedSaturdays: saturdayDates.filter((entry) => entry.status === 'blocked').length,
      saturdayDates,
    });
  }

  const firstMonthAvailable = monthlyAvailability[0]?.availableSaturdays || 0;
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (firstMonthAvailable === 0) urgencyLevel = 'critical';
  else if (firstMonthAvailable === 1) urgencyLevel = 'high';
  else if (firstMonthAvailable <= 2) urgencyLevel = 'medium';

  const currentMonthName = getMonthName(currentMonth, locale);
  let nextAvailableDate: string | null = null;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let day = new Date(tomorrow); day <= endDate; day.setDate(day.getDate() + 1)) {
    const date = toIsoDateString(day);
    if (!bookedDatesSet.has(date) && !blockedDatesSet.has(date)) {
      nextAvailableDate = date;
      break;
    }
  }

  return {
    ok: true,
    data: {
      nextAvailableDate,
      nextAvailableSaturday,
      monthlyAvailability,
      scarcityMessage: getScarcityMessage(locale, currentMonthName, urgencyLevel, firstMonthAvailable),
      urgencyLevel,
    },
    generatedAt: new Date().toISOString(),
  };
}
