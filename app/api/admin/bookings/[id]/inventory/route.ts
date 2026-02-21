// app/api/admin/bookings/[id]/inventory/route.ts
// API per gestionar l'inventari assignat a una reserva
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { getInventoryBundles } from '@/lib/services/inventoryBundles';

interface Params {
  params: { id: string };
}

// GET - Llistar inventari assignat a la reserva + disponible
export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const bookingId = params.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pack: {
          include: {
            inventory: {
              include: { item: true },
            },
          },
        },
      },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Reserva no trobada' }, { status: 404 });
    }

    const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'] as const;

    // Obtenir items assignats a la reserva
    const assigned = await prisma.bookingInventory.findMany({
      where: { bookingId },
      include: {
        item: true,
      },
      orderBy: { item: { category: 'asc' } },
    });

    // Obtenir items disponibles (per cercar i afegir)
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const available = await prisma.inventoryItem.findMany({
      where: {
        status: { in: ['AVAILABLE', 'IN_USE'] },
        ...(category && { category: category as any }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }),
        bookingItems: {
          none: {
            bookingId: { not: bookingId },
            booking: {
              status: { in: ACTIVE_BOOKING_STATUSES as any },
            },
          },
        },
        // Excloure els ja assignats
        NOT: {
          id: { in: assigned.map((a) => a.itemId) },
        },
      },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
      take: 50,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    log.error('Error obtenint inventari de reserva:', error);
    return NextResponse.json(
      { error: 'Error obtenint inventari' },
      { status: 500 }
    );
  }
}

// POST - Assignar un element a la reserva
const assignSchema = z.object({
  itemId: z.string().min(1).optional(),
  bundleId: z.string().min(1).optional(),
  mode: z.enum(['single', 'pack', 'bundle']).default('single'),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const bookingId = params.id;
    const body = await req.json();
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { itemId, bundleId, quantity, mode } = parsed.data;

    // Verificar que la reserva existeix
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Reserva no trobada' }, { status: 404 });
    }

    const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'] as const;

    const assignOne = async (targetItemId: string, targetQuantity: number) => {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: targetItemId },
      });
      if (!item) {
        return {
          ok: false as const,
          reason: 'NOT_FOUND' as const,
          itemId: targetItemId,
          itemCode: targetItemId.slice(0, 8),
          itemName: 'Element no trobat',
        };
      }

      const existing = await prisma.bookingInventory.findUnique({
        where: { bookingId_itemId: { bookingId, itemId: targetItemId } },
      });
      if (existing) {
        return {
          ok: false as const,
          reason: 'ALREADY_ASSIGNED' as const,
          itemId: targetItemId,
          itemCode: item.code,
          itemName: item.name,
        };
      }

      const overlapping = await prisma.bookingInventory.count({
        where: {
          itemId: targetItemId,
          bookingId: { not: bookingId },
          booking: {
            status: { in: ACTIVE_BOOKING_STATUSES as any },
          },
        },
      });
      if (overlapping > 0) {
        return {
          ok: false as const,
          reason: 'OVERLAP' as const,
          itemId: targetItemId,
          itemCode: item.code,
          itemName: item.name,
        };
      }

      const assignment = await prisma.bookingInventory.create({
        data: {
          bookingId,
          itemId: targetItemId,
          quantity: targetQuantity,
          conditionBefore: item.condition,
        },
        include: { item: true },
      });

      if (['CONFIRMED', 'PREPARING'].includes(booking.status)) {
        await prisma.inventoryItem.update({
          where: { id: targetItemId },
          data: { status: 'IN_USE' },
        });
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

      return { ok: true, assignment } as const;
    };

    if (mode === 'pack') {
      const packItems = await prisma.packInventory.findMany({
        where: { packId: booking.packId },
      });

      if (packItems.length === 0) {
        return NextResponse.json({ error: 'Aquest pack no té inventari configurat' }, { status: 400 });
      }

      const results = await Promise.all(
        packItems.map((row) => assignOne(row.itemId, Math.max(1, row.quantity || 1)))
      );
      const created = results.filter((r) => r.ok).length;
      const skippedDetails = results
        .filter((r) => !r.ok)
        .map((r) => {
          const failed = r as {
            ok: false;
            reason: 'NOT_FOUND' | 'ALREADY_ASSIGNED' | 'OVERLAP';
            itemId: string;
            itemCode: string;
            itemName: string;
          };
          return {
            reason: failed.reason,
            itemId: failed.itemId,
            itemCode: failed.itemCode,
            itemName: failed.itemName,
          };
        });

      return NextResponse.json({
        ok: true,
        mode: 'pack',
        created,
        skipped: skippedDetails.map((s) => s.reason),
        skippedDetails,
      });
    }

    if (mode === 'bundle') {
      if (!bundleId) {
        return NextResponse.json({ error: 'Falta bundleId' }, { status: 400 });
      }
      const bundles = await getInventoryBundles();
      const bundle = bundles.find((b) => b.id === bundleId);
      if (!bundle) {
        return NextResponse.json({ error: 'Lot no trobat' }, { status: 404 });
      }
      if (bundle.itemIds.length === 0) {
        return NextResponse.json({ error: 'Aquest lot no té elements' }, { status: 400 });
      }

      const results = await Promise.all(
        bundle.itemIds.map((bundleItemId) => assignOne(bundleItemId, 1))
      );
      const created = results.filter((r) => r.ok).length;
      const skippedDetails = results
        .filter((r) => !r.ok)
        .map((r) => {
          const failed = r as {
            ok: false;
            reason: 'NOT_FOUND' | 'ALREADY_ASSIGNED' | 'OVERLAP';
            itemId: string;
            itemCode: string;
            itemName: string;
          };
          return {
            reason: failed.reason,
            itemId: failed.itemId,
            itemCode: failed.itemCode,
            itemName: failed.itemName,
          };
        });

      return NextResponse.json({
        ok: true,
        mode: 'bundle',
        bundleId,
        created,
        skipped: skippedDetails.map((s) => s.reason),
        skippedDetails,
      });
    }

    if (!itemId) {
      return NextResponse.json({ error: 'Falta itemId' }, { status: 400 });
    }
    const single = await assignOne(itemId, quantity);
    if (!single.ok) {
      const reason = single.reason;
      if (reason === 'NOT_FOUND') return NextResponse.json({ error: 'Element no trobat' }, { status: 404 });
      if (reason === 'ALREADY_ASSIGNED') return NextResponse.json({ error: 'Element ja assignat a aquesta reserva' }, { status: 409 });
      if (reason === 'OVERLAP') return NextResponse.json({ error: 'Element ocupat en una altra reserva activa' }, { status: 409 });
      return NextResponse.json({ error: 'No s’ha pogut assignar' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, assignment: single.assignment });
  } catch (error) {
    log.error('Error assignant element a reserva:', error);
    return NextResponse.json(
      { error: 'Error assignant element' },
      { status: 500 }
    );
  }
}

// PATCH - Actualitzar assignació (checkout/checkin)
const updateSchema = z.object({
  assignmentId: z.string().min(1),
  checkedOut: z.boolean().optional(),
  checkedIn: z.boolean().optional(),
  conditionAfter: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { assignmentId, ...data } = parsed.data;

    const assignment = await prisma.bookingInventory.update({
      where: { id: assignmentId },
      data,
      include: { item: true },
    });

    // Si s'ha fet checkin, actualitzar la condició de l'element
    if (data.checkedIn && data.conditionAfter) {
      await prisma.inventoryItem.update({
        where: { id: assignment.itemId },
        data: { condition: data.conditionAfter },
      });
    }

    return NextResponse.json({ ok: true, assignment });
  } catch (error) {
    log.error('Error actualitzant assignació:', error);
    return NextResponse.json(
      { error: 'Error actualitzant assignació' },
      { status: 500 }
    );
  }
}

// DELETE - Treure un element de la reserva
export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Falta assignmentId' }, { status: 400 });
    }

    const assignment = await prisma.bookingInventory.findUnique({
      where: { id: assignmentId },
      include: { item: true, booking: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignació no trobada' }, { status: 404 });
    }

    // Eliminar l'assignació
    await prisma.bookingInventory.delete({
      where: { id: assignmentId },
    });

    // Comprovar si l'element té altres assignacions actives
    const otherAssignments = await prisma.bookingInventory.count({
      where: {
        itemId: assignment.itemId,
        booking: {
          status: { in: ['CONFIRMED', 'PREPARING'] },
        },
      },
    });

    // Si no té altres assignacions actives, tornar a AVAILABLE
    if (otherAssignments === 0 && assignment.item.status === 'IN_USE') {
      await prisma.inventoryItem.update({
        where: { id: assignment.itemId },
        data: { status: 'AVAILABLE' },
      });
    }

    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'booking_inventory',
        entityId: assignmentId,
        details: {
          bookingRef: assignment.booking.reference,
          itemCode: assignment.item.code,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant assignació:', error);
    return NextResponse.json(
      { error: 'Error eliminant assignació' },
      { status: 500 }
    );
  }
}
