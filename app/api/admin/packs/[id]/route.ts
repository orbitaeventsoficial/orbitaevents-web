// app/api/admin/packs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { translateTextForLocale } from '@/lib/services/translationService';

type PackTranslationInput = {
  locale: string;
  name: string;
  description?: string | null;
  tagline?: string | null;
  features?: string[];
};

async function completePackTranslations(input: unknown): Promise<PackTranslationInput[] | undefined> {
  if (!Array.isArray(input) || input.length === 0) return undefined;

  const locales = ['ca', 'es', 'en'] as const;
  const normalized: PackTranslationInput[] = locales.map((locale) => {
    const found = (input as PackTranslationInput[]).find((t) => t?.locale === locale);
    return {
      locale,
      name: String(found?.name || '').trim(),
      description: String(found?.description || '').trim(),
      tagline: String(found?.tagline || '').trim(),
      features: Array.isArray(found?.features)
        ? found.features.map((f) => String(f).trim()).filter(Boolean)
        : [],
    };
  });

  const source =
    normalized.find((t) => t.locale === 'ca' && t.name) ||
    normalized.find((t) => t.name);

  if (!source) return normalized;

  const out = [...normalized];
  for (const locale of locales) {
    if (locale === source.locale) continue;
    const idx = out.findIndex((t) => t.locale === locale);
    const target = out[idx];

    if (!target.name) {
      target.name = await translateTextForLocale(source.name, locale);
    }
    if (!target.description && source.description) {
      target.description = await translateTextForLocale(source.description, locale);
    }
    if (!target.tagline && source.tagline) {
      target.tagline = await translateTextForLocale(source.tagline, locale);
    }
    if ((!target.features || target.features.length === 0) && source.features && source.features.length > 0) {
      target.features = await Promise.all(
        source.features.map((f) => translateTextForLocale(f, locale))
      );
    }

    out[idx] = target;
  }

  return out;
}

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
      const completedTranslations = await completePackTranslations(body.translations);
      // Esborrar traduccions existents i crear les noves
      updateData.translations = {
        deleteMany: {},
        create: (completedTranslations || []).map((t) => ({
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
