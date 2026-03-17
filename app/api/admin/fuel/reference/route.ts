import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { getFuelCostPerKmReference, refreshFuelReferenceNow } from '@/lib/services/fuelReferenceService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const data = await getFuelCostPerKmReference();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    log.error('Error obtenint referència preu combustible', error, { context: { endpoint: 'GET /api/admin/fuel/reference' } });
    return NextResponse.json({ ok: false, error: 'Error obtenint referència combustible' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const data = await refreshFuelReferenceNow();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    log.error('Error actualitzant referència preu combustible', error, { context: { endpoint: 'POST /api/admin/fuel/reference' } });
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'FUEL_REFRESH_FAILED' },
      { status: 500 }
    );
  }
}
