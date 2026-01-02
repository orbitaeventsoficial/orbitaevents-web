// app/api/admin/inventory/[id]/route.ts
// API per gestionar element individual d'inventari
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

// GET - Detall d'un element
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        packItems: {
          include: { pack: { include: { translations: true } } },
        },
        extraItems: {
          include: { extra: { include: { translations: true } } },
        },
        bookingItems: {
          include: {
            booking: {
              select: {
                id: true,
                reference: true,
                eventDate: true,
                clientName: true,
                status: true,
              },
            },
          },
          take: 20,
          orderBy: { booking: { eventDate: 'desc' } },
        },
        usageHistory: {
          take: 20,
          orderBy: { usedAt: 'desc' },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Element no trobat' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    log.error('Error obtenint element:', error);
    return NextResponse.json(
      { error: 'Error obtenint element' },
      { status: 500 }
    );
  }
}

// PATCH - Actualitzar element
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const { id } = params;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Element no trobat' },
        { status: 404 }
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: body,
    });

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'inventory',
        entityId: id,
        details: { changes: Object.keys(body) },
      },
    });

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    log.error('Error actualitzant element:', error);
    return NextResponse.json(
      { error: 'Error actualitzant element' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar element (soft delete: canviar a RETIRED)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookingItems: true, packItems: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Element no trobat' },
        { status: 404 }
      );
    }

    // Si té relacions, fer soft delete
    if (existing._count.bookingItems > 0 || existing._count.packItems > 0) {
      await prisma.inventoryItem.update({
        where: { id },
        data: { status: 'RETIRED' },
      });
    } else {
      await prisma.inventoryItem.delete({
        where: { id },
      });
    }

    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'inventory',
        entityId: id,
        details: { code: existing.code },
      },
    });

    return NextResponse.json({
      ok: true,
      softDeleted: existing._count.bookingItems > 0 || existing._count.packItems > 0,
    });
  } catch (error) {
    log.error('Error eliminant element:', error);
    return NextResponse.json(
      { error: 'Error eliminant element' },
      { status: 500 }
    );
  }
}
