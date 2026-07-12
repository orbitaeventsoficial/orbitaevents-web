import type { BookingStatus, Prisma } from '@prisma/client';

type BookingStatusLike = BookingStatus | string;

export type BookingInventoryConflictInput = {
  bookingId: string;
  eventDate?: Date | string | null;
  statuses: readonly BookingStatusLike[];
};

export function getBookingEventDayRange(eventDate?: Date | string | null) {
  if (!eventDate) return null;
  const date = eventDate instanceof Date ? eventDate : new Date(eventDate);
  if (Number.isNaN(date.getTime())) return null;
  const gte = new Date(date);
  gte.setUTCHours(0, 0, 0, 0);
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

export function buildBookingInventoryConflictBookingWhere(input: BookingInventoryConflictInput): Prisma.BookingWhereInput {
  const eventDate = getBookingEventDayRange(input.eventDate);
  const statuses = input.statuses.map((status) => status as BookingStatus);
  return {
    id: { not: input.bookingId },
    status: { in: statuses },
    ...(eventDate ? { eventDate } : {}),
  };
}
