import { NextResponse } from 'next/server';
import { EXTRAS, type ExtraDefinition } from '@/config/packs-config';

export const dynamic = 'force-dynamic';

/**
 * API pública d'extras per al configurador.
 *
 * Prioritat:
 * 1. Model Extra de Prisma (BD) — font de veritat per preus
 * 2. Fallback a packs-config.ts EXTRAS — si la BD no té dades
 *
 * Retorna format ExtraDefinition[] compatible amb el configurador.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'ca';

  try {
    const { prisma } = await import('@/lib/prisma');

    const dbExtras = await prisma.extra.findMany({
      where: { isActive: true },
      include: {
        translations: {
          where: { locale },
        },
      },
      orderBy: { order: 'asc' },
    });

    if (dbExtras.length > 0) {
      const extras: ExtraDefinition[] = dbExtras.map((extra) => {
        const t = extra.translations[0];
        // Match amb el config estàtic per obtenir icon/category/compatibleWith
        const configMatch = EXTRAS.find((e) => e.id === extra.slug);

        return {
          id: extra.slug,
          name: t?.name || configMatch?.name || extra.slug,
          description: t?.description || configMatch?.description || '',
          price: extra.priceType === 'ON_REQUEST' ? null : extra.price,
          consultarPrecio: extra.priceType === 'ON_REQUEST',
          icon: configMatch?.icon || '🎵',
          category: configMatch?.category,
          compatibleWith: configMatch?.compatibleWith,
          popular: configMatch?.popular,
          premium: configMatch?.premium,
        };
      });

      return NextResponse.json({ ok: true, extras, source: 'database' });
    }

    // Fallback: no hi ha extras a la BD → usa config estàtic
    return NextResponse.json({
      ok: true,
      extras: EXTRAS.map((e) => ({ ...e })),
      source: 'config',
    });
  } catch (error) {
    console.error('[Extras] Error carregant des de BD, fallback a config:', error);
    return NextResponse.json({
      ok: true,
      extras: EXTRAS.map((e) => ({ ...e })),
      source: 'config',
    });
  }
}
