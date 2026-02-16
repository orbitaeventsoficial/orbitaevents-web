// app/api/admin/packs/route.ts
// API per gestionar packs
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { translateTextForLocale } from '@/lib/services/translationService';

export const dynamic = 'force-dynamic';

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
        ? found!.features.map((f) => String(f).trim()).filter(Boolean)
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

// GET - Llistar packs
export async function GET(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

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
    log.error('Error obtenint packs:', error);
    return NextResponse.json(
      { error: 'Error obtenint packs' },
      { status: 500 }
    );
  }
}

// POST - Crear nou pack
export async function POST(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const completedTranslations = await completePackTranslations(body.translations);
    const { slug, price, originalPrice, extraHourPrice, djHours, soundWatts,
      includesFog, includesMic, minGuests, maxGuests } = body;

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
        translations: completedTranslations ? {
          create: completedTranslations,
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
    log.error('Error creant pack:', error);
    return NextResponse.json(
      { error: 'Error creant pack' },
      { status: 500 }
    );
  }
}
