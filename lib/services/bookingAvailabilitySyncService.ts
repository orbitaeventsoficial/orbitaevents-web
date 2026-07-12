import type { BookingStatus } from '@prisma/client';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getBookingEventDayRange } from '@/lib/services/bookingInventoryAvailability';

type BookingStatusLike = BookingStatus | string | null | undefined;

export type BookingAvailabilitySyncInput = {
  bookingId: string;
  reference?: string | null;
  clientName?: string | null;
  previousEventDate?: Date | string | null;
  nextEventDate?: Date | string | null;
  nextStatus?: BookingStatusLike;
};

const activeAvailabilityStatuses = new Set<string>(ACTIVE_BOOKING_STATUSES);

function isAvailabilityBlockingStatus(status: BookingStatusLike) {
  return activeAvailabilityStatuses.has(String(status ?? ''));
}

export function normalizeBookingAvailabilityDate(raw?: Date | string | null) {
  const range = getBookingEventDayRange(raw);
  return range?.gte ?? null;
}

function buildBookingAvailabilityNote(input: { reference?: string | null; clientName?: string | null }) {
  const ref = input.reference?.trim();
  const name = input.clientName?.trim();
  if (ref && name) return `Reserva ${ref} · ${name}`;
  if (ref) return `Reserva ${ref}`;
  if (name) return `Reserva · ${name}`;
  return 'Reserva';
}

async function findReplacementBookingForDate(date: Date, excludeBookingId: string) {
  const range = getBookingEventDayRange(date);
  if (!range) return null;

  return prisma.booking.findFirst({
    where: {
      id: { not: excludeBookingId },
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      eventDate: range,
    },
    select: { id: true, reference: true, clientName: true },
    orderBy: [{ eventDate: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function refreshBookingAvailabilityDate(rawDate: Date | string | null | undefined, excludeBookingId: string) {
  const date = normalizeBookingAvailabilityDate(rawDate);
  if (!date) return { touched: false as const, status: 'SKIPPED' as const };

  const replacement = await findReplacementBookingForDate(date, excludeBookingId);
  if (replacement) {
    await prisma.availability.upsert({
      where: { date },
      create: {
        date,
        status: 'BOOKED',
        bookingId: replacement.id,
        note: buildBookingAvailabilityNote(replacement),
      },
      update: {
        status: 'BOOKED',
        bookingId: replacement.id,
        note: buildBookingAvailabilityNote(replacement),
      },
    });
    return { touched: true as const, status: 'BOOKED' as const, bookingId: replacement.id };
  }

  await prisma.availability.updateMany({
    where: { date, bookingId: excludeBookingId },
    data: { status: 'AVAILABLE', bookingId: null, note: null },
  });
  return { touched: true as const, status: 'AVAILABLE' as const };
}

export async function syncBookingAvailabilityForState(input: BookingAvailabilitySyncInput) {
  const previousDate = normalizeBookingAvailabilityDate(input.previousEventDate);
  const nextDate = normalizeBookingAvailabilityDate(input.nextEventDate);
  const nextBlocksAvailability = isAvailabilityBlockingStatus(input.nextStatus);

  if (previousDate && (!nextDate || previousDate.getTime() !== nextDate.getTime() || !nextBlocksAvailability)) {
    await refreshBookingAvailabilityDate(previousDate, input.bookingId);
  }

  if (!nextDate || !nextBlocksAvailability) {
    return { ok: true as const, status: nextBlocksAvailability ? 'SKIPPED' as const : 'RELEASED' as const };
  }

  await prisma.availability.upsert({
    where: { date: nextDate },
    create: {
      date: nextDate,
      status: 'BOOKED',
      bookingId: input.bookingId,
      note: buildBookingAvailabilityNote(input),
    },
    update: {
      status: 'BOOKED',
      bookingId: input.bookingId,
      note: buildBookingAvailabilityNote(input),
    },
  });

  return { ok: true as const, status: 'BOOKED' as const };
}
