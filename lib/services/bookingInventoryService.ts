import { BookingStatus, InventoryCategory, ItemStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ACTIVE_BOOKING_STATUSES, ACTIVE_INVENTORY_BOOKING_STATUSES } from '@/lib/constants';
import { getInventoryBundles } from '@/lib/services/inventoryBundles';
import { buildBookingInventoryConflictBookingWhere } from '@/lib/services/bookingInventoryAvailability';

type InventoryAssignmentFailure = {
  ok: false;
  reason: 'NOT_FOUND' | 'ALREADY_ASSIGNED' | 'OVERLAP';
  itemId: string;
  itemCode: string;
  itemName: string;
};

type InventoryBundleSelection = {
  id: string;
  itemIds: string[];
};

function normalizeInventoryCategory(category?: string | null): InventoryCategory | undefined {
  if (!category) return undefined;
  return Object.values(InventoryCategory).find((value) => value === category);
}

const assignSchema = z.object({
  itemId: z.string().min(1).optional(),
  bundleId: z.string().min(1).optional(),
  mode: z.enum(['single', 'pack', 'bundle']).default('single'),
  quantity: z.number().int().min(1).default(1),
});

const updateSchema = z.object({
  assignmentId: z.string().min(1),
  checkedOut: z.boolean().optional(),
  checkedIn: z.boolean().optional(),
  conditionAfter: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  notes: z.string().optional(),
});

export async function getBookingInventoryView(bookingId: string, requestUrl: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      pack: { include: { inventory: { include: { item: true } } } },
    },
  });
  if (!booking) return { ok: false as const, status: 404, body: { error: 'Reserva no trobada' } };

  const assigned = await prisma.bookingInventory.findMany({
    where: { bookingId },
    include: { item: true },
    orderBy: { item: { category: 'asc' } },
  });

  const { searchParams } = new URL(requestUrl);
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const normalizedCategory = normalizeInventoryCategory(category);

  const available = await prisma.inventoryItem.findMany({
    where: {
      status: { in: [ItemStatus.AVAILABLE, ItemStatus.IN_USE] },
      ...(normalizedCategory && { category: normalizedCategory }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
      bookingItems: {
        none: {
          booking: buildBookingInventoryConflictBookingWhere({
            bookingId,
            eventDate: booking.eventDate,
            statuses: ACTIVE_BOOKING_STATUSES,
          }),
        },
      },
      NOT: { id: { in: assigned.map((a) => a.itemId) } },
    },
    orderBy: [{ category: 'asc' }, { code: 'asc' }],
    take: 50,
  });

  return {
    ok: true as const,
    status: 200,
    body: {
      ok: true,
      assigned,
      available,
      packTemplate: {
        packId: booking.packId,
        packName: booking.pack.slug,
        items: booking.pack.inventory.map((row) => ({
          itemId: row.itemId,
          quantity: row.quantity,
          isRequired: row.isRequired,
          item: row.item,
        })),
      },
      bundles: await getInventoryBundles(),
    },
  };
}

export async function assignBookingInventory(bookingId: string, body: unknown) {
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, status: 400, body: { error: 'Dades invàlides', details: parsed.error.format() } };

  const { itemId, bundleId, quantity, mode } = parsed.data;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false as const, status: 404, body: { error: 'Reserva no trobada' } };

  const assignOne = async (targetItemId: string, targetQuantity: number) => {
    const item = await prisma.inventoryItem.findUnique({ where: { id: targetItemId } });
    if (!item) return { ok: false as const, reason: 'NOT_FOUND' as const, itemId: targetItemId, itemCode: targetItemId.slice(0, 8), itemName: 'Element no trobat' };

    const existing = await prisma.bookingInventory.findUnique({ where: { bookingId_itemId: { bookingId, itemId: targetItemId } } });
    if (existing) return { ok: false as const, reason: 'ALREADY_ASSIGNED' as const, itemId: targetItemId, itemCode: item.code, itemName: item.name };

    const overlapping = await prisma.bookingInventory.count({
      where: {
        itemId: targetItemId,
        booking: buildBookingInventoryConflictBookingWhere({
          bookingId,
          eventDate: booking.eventDate,
          statuses: ACTIVE_BOOKING_STATUSES,
        }),
      },
    });
    if (overlapping > 0) return { ok: false as const, reason: 'OVERLAP' as const, itemId: targetItemId, itemCode: item.code, itemName: item.name };

    const assignment = await prisma.bookingInventory.create({
      data: {
        bookingId,
        itemId: targetItemId,
        quantity: targetQuantity,
        conditionBefore: item.condition,
      },
      include: { item: true },
    });

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PREPARING) {
      await prisma.inventoryItem.update({ where: { id: targetItemId }, data: { status: 'IN_USE' } });
    }

    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        entity: 'booking_inventory',
        entityId: assignment.id,
        details: {
          bookingId,
          bookingRef: booking.reference,
          itemCode: item.code,
          itemName: item.name,
        },
      },
    });

    return { ok: true as const, assignment };
  };

  if (mode === 'pack') {
    const packItems = await prisma.packInventory.findMany({ where: { packId: booking.packId } });
    if (packItems.length === 0) return { ok: false as const, status: 400, body: { error: 'Aquest pack no té inventari configurat' } };

    const results = await Promise.all(packItems.map((row) => assignOne(row.itemId, Math.max(1, row.quantity || 1))));
    const created = results.filter((r) => r.ok).length;
    const skippedDetails = results.filter((r): r is InventoryAssignmentFailure => !r.ok).map((r) => ({ reason: r.reason, itemId: r.itemId, itemCode: r.itemCode, itemName: r.itemName }));
    return { ok: true as const, status: 200, body: { ok: true, mode: 'pack', created, skipped: skippedDetails.map((s) => s.reason), skippedDetails } };
  }

  if (mode === 'bundle') {
    if (!bundleId) return { ok: false as const, status: 400, body: { error: 'Falta bundleId' } };
    const bundles = await getInventoryBundles();
    const bundle = bundles.find((b: InventoryBundleSelection) => b.id === bundleId);
    if (!bundle) return { ok: false as const, status: 404, body: { error: 'Lot no trobat' } };
    if (bundle.itemIds.length === 0) return { ok: false as const, status: 400, body: { error: 'Aquest lot no té elements' } };

    const results = await Promise.all(bundle.itemIds.map((bundleItemId) => assignOne(bundleItemId, 1)));
    const created = results.filter((r) => r.ok).length;
    const skippedDetails = results.filter((r): r is InventoryAssignmentFailure => !r.ok).map((r) => ({ reason: r.reason, itemId: r.itemId, itemCode: r.itemCode, itemName: r.itemName }));
    return { ok: true as const, status: 200, body: { ok: true, mode: 'bundle', bundleId, created, skipped: skippedDetails.map((s) => s.reason), skippedDetails } };
  }

  if (!itemId) return { ok: false as const, status: 400, body: { error: 'Falta itemId' } };
  const single = await assignOne(itemId, quantity);
  if (!single.ok) {
    if (single.reason === 'NOT_FOUND') return { ok: false as const, status: 404, body: { error: 'Element no trobat' } };
    if (single.reason === 'ALREADY_ASSIGNED') return { ok: false as const, status: 409, body: { error: 'Element ja assignat a aquesta reserva' } };
    if (single.reason === 'OVERLAP') return { ok: false as const, status: 409, body: { error: 'Element ocupat en una altra reserva activa' } };
    return { ok: false as const, status: 400, body: { error: 'No s’ha pogut assignar' } };
  }

  return { ok: true as const, status: 200, body: { ok: true, assignment: single.assignment } };
}

export async function updateBookingInventoryAssignment(body: unknown) {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, status: 400, body: { error: 'Dades invàlides', details: parsed.error.format() } };

  const { assignmentId, ...data } = parsed.data;
  const assignment = await prisma.bookingInventory.update({ where: { id: assignmentId }, data, include: { item: true } });
  if (data.checkedIn && data.conditionAfter) {
    await prisma.inventoryItem.update({ where: { id: assignment.itemId }, data: { condition: data.conditionAfter } });
  }

  return { ok: true as const, status: 200, body: { ok: true, assignment } };
}

export async function removeBookingInventoryAssignment(assignmentId: string | null) {
  if (!assignmentId) return { ok: false as const, status: 400, body: { error: 'Falta assignmentId' } };

  const assignment = await prisma.bookingInventory.findUnique({ where: { id: assignmentId }, include: { item: true, booking: true } });
  if (!assignment) return { ok: false as const, status: 404, body: { error: 'Assignació no trobada' } };

  await prisma.bookingInventory.delete({ where: { id: assignmentId } });
  const otherAssignments = await prisma.bookingInventory.count({
    where: {
      itemId: assignment.itemId,
      booking: { status: { in: [...ACTIVE_INVENTORY_BOOKING_STATUSES] } },
    },
  });

  if (otherAssignments === 0 && assignment.item.status === 'IN_USE') {
    await prisma.inventoryItem.update({ where: { id: assignment.itemId }, data: { status: 'AVAILABLE' } });
  }

  await prisma.adminLog.create({
    data: {
      action: 'DELETE',
      entity: 'booking_inventory',
      entityId: assignmentId,
      details: { bookingRef: assignment.booking.reference, itemCode: assignment.item.code },
    },
  });

  return { ok: true as const, status: 200, body: { ok: true } };
}
