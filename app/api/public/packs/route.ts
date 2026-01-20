// app/api/public/packs/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA DE PACKS/PRECIOS
// ═══════════════════════════════════════════════════════════════════════════
//
// Devuelve información de packs y precios para el frontend.
// NO requiere autenticación - es pública pero con cache.
// Solo devuelve packs activos y datos públicos (sin info sensible).
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// Cache: revalidar cada hora (los precios no cambian frecuentemente)
export const revalidate = 3600;

interface PublicPack {
  slug: string;
  price: number;
  originalPrice: number | null;
  name: string;
  description: string | null;
}

interface PacksResponse {
  ok: boolean;
  packs: PublicPack[];
}

export async function GET() {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      packs: [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  }

  try {
    const packs = await prisma.pack.findMany({
      where: { isActive: true },
      include: {
        translations: true,
      },
      orderBy: { order: 'asc' },
    });

    // Transform to public format (only expose safe fields)
    const publicPacks: PublicPack[] = packs.map(pack => {
      // Get Spanish translation as default, fallback to first available
      const translation = pack.translations.find(t => t.locale === 'es')
        || pack.translations[0];

      return {
        slug: pack.slug,
        price: pack.price,
        originalPrice: pack.originalPrice,
        name: translation?.name || pack.slug,
        description: translation?.description || null,
      };
    });

    const response: PacksResponse = {
      ok: true,
      packs: publicPacks,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });

  } catch (error) {
    log.error('Error obtenint packs:', error);

    return NextResponse.json({
      ok: true,
      packs: [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  }
}
