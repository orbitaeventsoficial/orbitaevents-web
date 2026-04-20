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
      const alreadyAssignedIds = new Set(bookingWithPack.inventory.map((bi) => bi.itemId));
      const toAssign = bookingWithPack.pack.inventory.filter((pi) => !alreadyAssignedIds.has(pi.itemId));

      if (toAssign.length > 0) {
        // Batch: trobar items ocupats en reserves actives
        const overlapping = await prisma.bookingInventory.groupBy({
          by: ['itemId'],
          where: {
            itemId: { in: toAssign.map((pi) => pi.itemId) },
            bookingId: { not: bookingId },
            booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
          },
        });
        const busyIds = new Set(overlapping.map((o) => o.itemId));
        const available = toAssign.filter((pi) => !busyIds.has(pi.itemId));

        if (available.length > 0) {
          await prisma.bookingInventory.createMany({
            data: available.map((pi) => ({
              bookingId,
              itemId: pi.itemId,
              quantity: pi.quantity,
              conditionBefore: pi.item.condition,
            })),
            skipDuplicates: true,
          });

          await prisma.inventoryItem.updateMany({
            where: { id: { in: available.map((pi) => pi.itemId) } },
            data: { status: 'IN_USE' },
          });
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

    // Batch: crear registres d'ús
    if (eventDuration > 0 && bookingInv.length > 0) {
      await prisma.inventoryUsage.createMany({
        data: bookingInv.map((bi) => ({
          itemId: bi.itemId,
          bookingId,
          hoursUsed: eventDuration,
          notes: `Bolo ${existing.reference}`,
        })),
      });
    }

    // Batch: trobar items encara actius en altres reserves
    if (bookingInv.length > 0) {
      const itemIds = bookingInv.map((bi) => bi.itemId);
      const stillActive = await prisma.bookingInventory.groupBy({
        by: ['itemId'],
        where: {
          itemId: { in: itemIds },
          bookingId: { not: bookingId },
          booking: { status: { in: [...ACTIVE_INVENTORY_BOOKING_STATUSES] } },
        },
      });
      const stillActiveIds = new Set(stillActive.map((s) => s.itemId));
      const toRelease = itemIds.filter((id) => !stillActiveIds.has(id));

      if (toRelease.length > 0) {
        await prisma.inventoryItem.updateMany({
          where: { id: { in: toRelease } },
          data: { status: 'AVAILABLE' },
        });
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

    if (bookingInv.length > 0) {
      const itemIds = bookingInv.map((bi) => bi.itemId);
      const stillActive = await prisma.bookingInventory.groupBy({
        by: ['itemId'],
        where: {
          itemId: { in: itemIds },
          bookingId: { not: bookingId },
          booking: { status: { in: [...ACTIVE_INVENTORY_BOOKING_STATUSES] } },
        },
      });
      const stillActiveIds = new Set(stillActive.map((s) => s.itemId));
      const toRelease = itemIds.filter((id) => !stillActiveIds.has(id));

      if (toRelease.length > 0) {
        await prisma.inventoryItem.updateMany({
          where: { id: { in: toRelease } },
          data: { status: 'AVAILABLE' },
        });
      }
    }
  }

  return { statsUpdated };
}
