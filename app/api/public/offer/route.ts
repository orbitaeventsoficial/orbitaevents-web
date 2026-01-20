// app/api/public/offer/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA DE OFERTAS
// ═══════════════════════════════════════════════════════════════════════════
//
// Devuelve información de ofertas activas para el frontend.
// NO requiere autenticación - es pública pero con cache.
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// Cache: revalidar cada 15 minutos
export const revalidate = 900;

interface OfferResponse {
  ok: boolean;
  offer: {
    isActive: boolean;
    endDate: string | null;
    discount: number;
    ctaLink: string;
    title: string;
    description: string;
  };
}

const FALLBACK_OFFER = {
  isActive: false,
  endDate: null,
  discount: 0,
  ctaLink: '/contacto',
  title: '',
  description: '',
};

export async function GET() {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      offer: FALLBACK_OFFER,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'offer',
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const offer = {
      isActive: settingsMap['offer_active'] === 'true',
      endDate: settingsMap['offer_end_date'] || null,
      discount: parseInt(settingsMap['offer_discount'] || '0', 10),
      ctaLink: settingsMap['offer_cta_link'] || '/contacto',
      title: settingsMap['offer_title'] || '',
      description: settingsMap['offer_description'] || '',
    };

    const response: OfferResponse = {
      ok: true,
      offer,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });

  } catch (error) {
    log.error('Error obtenint offer:', error);

    return NextResponse.json({
      ok: true,
      offer: FALLBACK_OFFER,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  }
}
