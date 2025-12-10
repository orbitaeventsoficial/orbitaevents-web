// app/api/admin/packs/[id]/route.ts
// API per gestionar pack individual
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

// GET - Detall d'un pack
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const pack = await prisma.pack.findUnique({
      where: { id: params.id },
      include: {
        translations: true,
        inventory: { include: { item: true } },
        bookings: {
          select: { id: true, reference: true, eventDate: true, clientName: true, status: true },
          take: 10,
          orderBy: { eventDate: 'desc' },
        },
      },
    });

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack no trobat' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      pack,
    });
  } catch (error) {
    console.error('Error obtenint pack:', error);
    return NextResponse.json(
      { error: 'Error obtenint pack' },
      { status: 500 }
    );
  }
}

// PATCH - Actualitzar pack
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const { id } = params;
    const { translations, inventory, ...packData } = body;

    const existing = await prisma.pack.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pack no trobat' },
        { status: 404 }
      );
    }

    // Actualitzar pack
    const pack = await prisma.pack.update({
      where: { id },
      data: packData,
    });

    // Actualitzar traduccions si es proporcionen
    if (translations) {
      for (const trans of translations) {
        await prisma.packTranslation.upsert({
          where: { packId_locale: { packId: id, locale: trans.locale } },
          create: { packId: id, ...trans },
          update: trans,
        });
      }
    }

    // Actualitzar inventari si es proporciona
    if (inventory) {
      // Eliminar inventari actual
      await prisma.packInventory.deleteMany({
        where: { packId: id },
      });

      // Crear nou inventari
      await prisma.packInventory.createMany({
        data: inventory.map((item: { itemId: string; quantity?: number; isRequired?: boolean }) => ({
          packId: id,
          itemId: item.itemId,
          quantity: item.quantity || 1,
          isRequired: item.isRequired ?? true,
        })),
      });
    }

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'pack',
        entityId: id,
        details: { changes: Object.keys(body) },
      },
    });

    return NextResponse.json({
      ok: true,
      pack,
    });
  } catch (error) {
    console.error('Error actualitzant pack:', error);
    return NextResponse.json(
      { error: 'Error actualitzant pack' },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar pack (soft delete)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    const existing = await prisma.pack.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pack no trobat' },
        { status: 404 }
      );
    }

    // Soft delete - desactivar
    await prisma.pack.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'pack',
        entityId: id,
        details: { slug: existing.slug, softDeleted: true },
      },
    });

    return NextResponse.json({
      ok: true,
      softDeleted: true,
    });
  } catch (error) {
    console.error('Error eliminant pack:', error);
    return NextResponse.json(
      { error: 'Error eliminant pack' },
      { status: 500 }
    );
  }
}
