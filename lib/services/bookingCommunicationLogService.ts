import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type BookingCommunicationLogAction =
  | 'COMM_SENT'
  | 'COMM_RESPONDED'
  | 'PAYMENT_REMINDER_SENT'
  | 'SEND_POST_EVENT_EMAIL';

export async function recordBookingCommunicationLog(input: {
  action: BookingCommunicationLogAction;
  bookingId: string;
  details?: Record<string, unknown>;
}) {
  return prisma.adminLog.create({
    data: {
      action: input.action,
      entity: 'booking',
      entityId: input.bookingId,
      details: (input.details ?? {}) as Prisma.InputJsonValue,
    },
  });
}
