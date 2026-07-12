import { EventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACTIVE_BOOKING_STATUSES, ACTIVE_INVENTORY_BOOKING_STATUSES } from '@/lib/constants';
import { calculateEventDuration } from '@/lib/inventory-utils';
import { tryEnsureCompletedBookingPortalAccess } from '@/lib/services/bookingPortalCompletionService';
import { buildBookingInventoryConflictBookingWhere } from '@/lib/services/bookingInventoryAvailability';
import { onBookingConfirmed } from '@/lib/services/automationTriggers';


export type ManagedBookingStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';

export type BookingStatusTransitionInput = {
  bookingId: string;
  oldStatus: ManagedBookingStatus;
  newStatus: ManagedBookingStatus;
  existing: {
    guestCount: number;
    eventType: EventType;
    eventLocation: string;
    eventDate: Date | string;
    eventStartTime?: string | null;
    eventEndTime?: string | null;
    reference: string;
    preferredLocale?: string | null;
    clientEmail?: string | null;
    clientName: string;
  };
  portalTrigger: string;
};

async function createCompletionLiveNotificationOnce(input: {
  bookingId: string;
  eventType: EventType;
  eventLocation: string;
}) {
  const existingNotification = await prisma.liveNotification.findFirst({
    where: { bookingId: input.bookingId, isReal: true },
    select: { id: true },
  });
  if (existingNotification) return false;

  await prisma.liveNotification.create({
    data: {
      type: input.eventType,
      location: input.eventLocation,
      isReal: true,
      bookingId: input.bookingId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return true;
}

async function syncCompletionInventoryUsage(input: {
  bookingId: string;
  bookingInv: Array<{ itemId: string }>;
  eventDuration: number;
  reference: string;
}) {
  const itemIds = input.bookingInv.map((bi) => bi.itemId);
  if (input.eventDuration <= 0 || itemIds.length === 0) return;

  const notes = `Bolo ${input.reference}`;
  const existingUsage = await prisma.inventoryUsage.findMany({
    where: {
      bookingId: input.bookingId,
      itemId: { in: itemIds },
    },
    select: { itemId: true },
  });
  const existingItemIds = new Set(existingUsage.map((usage) => usage.itemId));

  if (existingItemIds.size > 0) {
    await prisma.inventoryUsage.updateMany({
      where: {
        bookingId: input.bookingId,
        itemId: { in: [...existingItemIds] },
      },
      data: {
        hoursUsed: input.eventDuration,
        notes,
      },
    });
  }

  const missing = input.bookingInv.filter((bi) => !existingItemIds.has(bi.itemId));
  if (missing.length === 0) return;

  await prisma.inventoryUsage.createMany({
    data: missing.map((bi) => ({
      itemId: bi.itemId,
      bookingId: input.bookingId,
      hoursUsed: input.eventDuration,
      notes,
    })),
  });
}

export async function applyBookingStatusSideEffects(input: BookingStatusTransitionInput) {
  const { bookingId, oldStatus, newStatus, existing, portalTrigger } = input;
  let statsUpdated = false;

  if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
    statsUpdated = await createCompletionLiveNotificationOnce({
      bookingId,
      eventType: existing.eventType,
      eventLocation: existing.eventLocation,
    });
  }

  if (newStatus === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
    await onBookingConfirmed(bookingId, { source: 'booking-status-transition' });

    const bookingWithPack = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pack: { include: { inventory: { include: { item: true } } } },
        inventory: true,
      },
    });

    if (bookingWithPack?.pack?.inventory) {
      const alreadyAssignedIds = new Set(bookingWithPack.inventory.map((bi) => bi.itemId));
      if (alreadyAssignedIds.size > 0) {
        await prisma.inventoryItem.updateMany({
          where: { id: { in: [...alreadyAssignedIds] } },
          data: { status: 'IN_USE' },
        });
      }

      const toAssign = bookingWithPack.pack.inventory.filter((pi) => !alreadyAssignedIds.has(pi.itemId));

      if (toAssign.length > 0) {
        // Batch: trobar items ocupats en reserves actives
        const overlapping = await prisma.bookingInventory.groupBy({
          by: ['itemId'],
          where: {
            itemId: { in: toAssign.map((pi) => pi.itemId) },
            booking: buildBookingInventoryConflictBookingWhere({
              bookingId,
              eventDate: existing.eventDate,
              statuses: ACTIVE_BOOKING_STATUSES,
            }),
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

    await syncCompletionInventoryUsage({
      bookingId,
      bookingInv,
      eventDuration,
      reference: existing.reference,
    });

    if (bookingInv.length > 0) {
      await prisma.bookingInventory.updateMany({
        where: { bookingId },
        data: { checkedOut: true, checkedIn: true },
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
