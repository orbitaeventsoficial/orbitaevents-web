// app/api/admin/packs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();

    // Validar que el slug no estigui duplicat (si s'ha canviat)
    if (body.slug) {
      const existingPack = await prisma.pack.findFirst({
        where: {
          slug: body.slug,
          NOT: { id }
        }
      });

      if (existingPack) {
        return NextResponse.json(
          { error: 'Aquest slug ja està en ús per un altre pack' },
          { status: 400 }
        );
      }
    }

    // Preparar dades d'actualització
    const updateData: any = {
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
    };

    // Afegir slug si s'ha proporcionat
    if (body.slug) {
      updateData.slug = body.slug;
    }

    // Actualitzar traduccions si s'han proporcionat
    if (body.translations && Array.isArray(body.translations)) {
      // Esborrar traduccions existents i crear les noves
      updateData.translations = {
        deleteMany: {},
        create: body.translations.map((t: any) => ({
          locale: t.locale,
          name: t.name,
          description: t.description,
          tagline: t.tagline,
          features: t.features || [],
        }))
      };
    }

    // Actualitzar pack
    const updatedPack = await prisma.pack.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
      }
    });

    return NextResponse.json(updatedPack);
  } catch (error) {
    log.error('Error actualitzant pack:', error);
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
  const authError = requireAuth(request);
  if (authError) return authError;
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
    log.error('Error obtenint pack:', error);
    return NextResponse.json(
      { error: 'Error obtenint pack' },
      { status: 500 }
    );
  }
}