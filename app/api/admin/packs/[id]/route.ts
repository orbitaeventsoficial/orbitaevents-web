// app/api/admin/packs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Actualitzar pack
    const updatedPack = await prisma.pack.update({
      where: { id },
      data: {
        price: body.price,
        originalPrice: body.originalPrice,
        extraHourPrice: body.extraHourPrice,
        djHours: body.djHours,
        soundWatts: body.soundWatts,
        includesFog: body.includesFog,
        includesMic: body.includesMic,
        minGuests: body.minGuests,
        maxGuests: body.maxGuests,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        order: body.order,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedPack);
  } catch (error) {
    console.error('Error actualitzant pack:', error);
    return NextResponse.json(
      { error: 'Error actualitzant pack' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pack = await prisma.pack.findUnique({
      where: { id },
      include: {
        translations: true,
        inventory: {
          include: { item: { select: { code: true, name: true } } },
        },
      },
    });

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack no trobat' },
        { status: 404 }
      );
    }

    return NextResponse.json(pack);
  } catch (error) {
    console.error('Error obtenint pack:', error);
    return NextResponse.json(
      { error: 'Error obtenint pack' },
      { status: 500 }
    );
  }
}
