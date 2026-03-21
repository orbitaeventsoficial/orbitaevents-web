import { EventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACTIVE_BOOKING_STATUSES, ACTIVE_INVENTORY_BOOKING_STATUSES } from '@/lib/constants';
import { calculateEventDuration } from '@/lib/inventory-utils';
import { tryEnsureCompletedBookingPortalAccess } from '@/lib/services/bookingPortalCompletionService';


export type ManagedBookingStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';

export type BookingStatusTransitionInput = {
  bookingId: string;
  oldStatus: ManagedBookingStatus;
  newStatus: ManagedBookingStatus;
  existing: {
    guestCount: number;
    eventType: EventType;
    eventLocation: string;
    eventStartTime?: string | null;
    eventEndTime?: string | null;
    reference: string;
    preferredLocale?: string | null;
    clientEmail?: string | null;
    clientName: string;
  };
  portalTrigger: string;
};

export async function applyBookingStatusSideEffects(input: BookingStatusTransitionInput) {
  const { bookingId, oldStatus, newStatus, existing, portalTrigger } = input;
  let statsUpdated = false;

  if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE settings
        SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)
        WHERE key = 'total_events'
      `;

      const guests = existing.guestCount || 0;
      if (guests > 0) {
        await tx.$executeRaw`
          UPDATE settings
          SET value = CAST(CAST(value AS INTEGER) + ${guests} AS TEXT)
          WHERE key = 'total_people'
        `;
      }

      await tx.liveNotification.create({
        data: {
          type: existing.eventType,
          location: existing.eventLocation,
          isReal: true,
          bookingId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });

    statsUpdated = true;
  }

  if (newStatus === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
    const bookingWithPack = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pack: { include: { inventory: { include: { item: true } } } },
        inventory: true,
      },
    });

    if (bookingWithPack?.pack?.inventory) {
      for (const packItem of bookingWithPack.pack.inventory) {
        const alreadyAssigned = bookingWithPack.inventory.some((bi) => bi.itemId === packItem.itemId);
        if (!alreadyAssigned) {
          const overlapping = await prisma.bookingInventory.count({
            where: {
              itemId: packItem.itemId,
              bookingId: { not: bookingId },
              booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
            },
          });
          if (overlapping > 0) continue;

          await prisma.bookingInventory.create({
            data: {
              bookingId,
              itemId: packItem.itemId,
              quantity: packItem.quantity,
              conditionBefore: packItem.item.condition,
            },
          });
          await prisma.inventoryItem.update({ where: { id: packItem.itemId }, data: { status: 'IN_USE' } });
        }
      }
    }
  }

  if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
    const bookingInv = await prisma.bookingInventory.findMany({
      where: { bookingId },
      include: { item: true },
    });

    const eventDuration = calculateEventDuration(existing.eventStartTime, existing.eventEndTime);

    for (const bi of bookingInv) {
      if (eventDuration > 0) {
        await prisma.inventoryUsage.create({
          data: {
            itemId: bi.itemId,
            bookingId,
            hoursUsed: eventDuration,
            notes: `Bolo ${existing.reference}`,
          },
        });
      }

      const otherActive = await prisma.bookingInventory.count({
        where: {
          itemId: bi.itemId,
          bookingId: { not: bookingId },
          booking: { status: { in: [...ACTIVE_INVENTORY_BOOKING_STATUSES] } },
        },
      });

      if (otherActive === 0) {
        await prisma.inventoryItem.update({ where: { id: bi.itemId }, data: { status: 'AVAILABLE' } });
      }
    }

    await tryEnsureCompletedBookingPortalAccess({
      bookingId,
      preferredLocale: existing.preferredLocale || 'ca',
      clientEmail: existing.clientEmail,
      clientName: existing.clientName,
      trigger: portalTrigger,
    });
  }

  if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
    await prisma.availability.updateMany({
      where: { bookingId },
      data: { status: 'AVAILABLE', bookingId: null },
    });

    const bookingInv = await prisma.bookingInventory.findMany({ where: { bookingId } });
    for (const bi of bookingInv) {
      const otherActive = await prisma.bookingInventory.count({
        where: {
          itemId: bi.itemId,
          bookingId: { not: bookingId },
          booking: { status: { in: [...ACTIVE_INVENTORY_BOOKING_STATUSES] } },
        },
      });

      if (otherActive === 0) {
        await prisma.inventoryItem.update({ where: { id: bi.itemId }, data: { status: 'AVAILABLE' } });
      }
    }
  }

  return { statsUpdated };
}
