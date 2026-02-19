// app/api/admin/bookings/[id]/inventory/route.ts
// API per gestionar l'inventari assignat a una reserva
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

// GET - Llistar inventari assignat a la reserva + disponible
export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const bookingId = params.id;

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
  itemId: z.string().min(1),
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

    const { itemId, quantity } = parsed.data;

    // Verificar que la reserva existeix
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Reserva no trobada' }, { status: 404 });
    }

    // Verificar que l'element existeix
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      return NextResponse.json({ error: 'Element no trobat' }, { status: 404 });
    }

    // Verificar que no està ja assignat
    const existing = await prisma.bookingInventory.findUnique({
      where: { bookingId_itemId: { bookingId, itemId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Element ja assignat a aquesta reserva' }, { status: 409 });
    }

    // Crear l'assignació
    const assignment = await prisma.bookingInventory.create({
      data: {
        bookingId,
        itemId,
        quantity,
        conditionBefore: item.condition,
      },
      include: { item: true },
    });

    // Marcar l'element com a IN_USE si la reserva està confirmada/preparant
    if (['CONFIRMED', 'PREPARING'].includes(booking.status)) {
      await prisma.inventoryItem.update({
        where: { id: itemId },
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

    return NextResponse.json({ ok: true, assignment });
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
