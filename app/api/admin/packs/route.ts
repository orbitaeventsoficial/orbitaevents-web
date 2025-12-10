// app/api/admin/packs/route.ts
// API per gestionar packs
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Llistar packs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'ca';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const packs = await prisma.pack.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        translations: { where: { locale } },
        inventory: { include: { item: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      ok: true,
      packs,
    });
  } catch (error) {
    console.error('Error obtenint packs:', error);
    return NextResponse.json(
      { error: 'Error obtenint packs' },
      { status: 500 }
    );
  }
}

// POST - Crear nou pack
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, price, originalPrice, extraHourPrice, djHours, soundWatts,
      includesFog, includesMic, minGuests, maxGuests, translations } = body;

    if (!slug || !price || !djHours) {
      return NextResponse.json(
        { error: 'slug, price i djHours són obligatoris' },
        { status: 400 }
      );
    }

    const pack = await prisma.pack.create({
      data: {
        slug,
        price,
        originalPrice,
        extraHourPrice: extraHourPrice || 75,
        djHours,
        soundWatts: soundWatts || 4000,
        includesFog: includesFog ?? true,
        includesMic: includesMic ?? false,
        minGuests,
        maxGuests,
        translations: translations ? {
          create: translations,
        } : undefined,
      },
      include: { translations: true },
    });

    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        entity: 'pack',
        entityId: pack.id,
        details: { slug, price },
      },
    });

    return NextResponse.json({
      ok: true,
      pack,
    });
  } catch (error) {
    console.error('Error creant pack:', error);
    return NextResponse.json(
      { error: 'Error creant pack' },
      { status: 500 }
    );
  }
}
