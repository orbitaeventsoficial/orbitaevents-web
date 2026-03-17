import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function normalizeBookingStatus(status: string): BookingStatus | undefined {
  return Object.values(BookingStatus).includes(status as BookingStatus) ? (status as BookingStatus) : undefined;
}

export async function listAdminEvents(status: string, daysAgo: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const normalizedStatus = normalizeBookingStatus(status);
  if (!normalizedStatus) {
    return { success: true, data: [], stats: { total: 0, pending: 0, sent: 0 } };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      status: normalizedStatus,
      eventDate: {
        gte: cutoffDate,
        lte: new Date(),
      },
    },
    select: {
      id: true,
      eventDate: true,
      status: true,
      clientName: true,
      clientEmail: true,
      eventType: true,
      postEventEmailSentAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { eventDate: 'desc' },
    take: 100,
  });

  return {
    success: true,
    data: bookings,
    stats: {
      total: bookings.length,
      pending: bookings.filter((booking) => !booking.postEventEmailSentAt).length,
      sent: bookings.filter((booking) => booking.postEventEmailSentAt).length,
    },
  };
}

export async function markAdminEventPostSent(bookingId?: string, postEventSentAt?: string) {
  if (!bookingId) {
    return { status: 400, body: { error: 'bookingId és obligatori' } };
  }

  const updateData: Record<string, unknown> = {};
  if (postEventSentAt) {
    updateData.postEventEmailSentAt = new Date(postEventSentAt);
  }

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
  });

  return { status: 200, body: { success: true, data: booking } };
}



