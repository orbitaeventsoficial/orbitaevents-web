import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { isAdminStatKey, listAdminStats, updateAdminStatFallback } from '@/lib/services/adminStatsService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const stats = await listAdminStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    log.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { key, fallback, resetToCalculated } = body as {
      key?: string;
      fallback?: number;
      resetToCalculated?: boolean;
    };

    if (!key) {
      return NextResponse.json(
        { ok: false, error: 'Key es requerido' },
        { status: 400 }
      );
    }

    if (!isAdminStatKey(key)) {
      return NextResponse.json(
        { ok: false, error: 'Estadística no válida' },
        { status: 400 }
      );
    }

    const result = await updateAdminStatFallback({ key, fallback, resetToCalculated });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error actualizando estadística';
    const status = message === 'Fallback debe ser un número positivo' ? 400 : 500;

    if (status === 500) {
      log.error('Error actualizando estadística:', error);
    }

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}
