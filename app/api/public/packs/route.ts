// app/api/public/packs/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA DE PACKS/PRECIOS
// ═══════════════════════════════════════════════════════════════════════════
//
// Devuelve información de packs y precios para el frontend.
// NO requiere autenticación - es pública y sin cache.
// Solo devuelve packs activos y datos públicos (sin info sensible).
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { getDbPacks } from '@/lib/packs-db';

// No cache to reflect admin changes immediately.
export const revalidate = 0;

interface PacksResponse {
  ok: boolean;
  packs: unknown[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceParam = searchParams.get('service');
  const allowedServices = new Set(['bodas', 'fiestas', 'discomovil', 'empresas', 'alquiler', 'produccion']);
  const service = serviceParam && allowedServices.has(serviceParam) ? serviceParam : undefined;
  const locale = searchParams.get('locale') || 'es';

  const packs = await getDbPacks({
    service: service as any,
    locale,
  });

  const response: PacksResponse = {
    ok: true,
    packs,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
