import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import {
  getLifecycleDistribution,
  getHealthDistribution,
} from '@/lib/services/customerSegmentationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/customers/segments/distribution
 * Retorna distribució per lifecycle stage i health score (per KPIs i gràfiques).
 */
export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const [lifecycle, health] = await Promise.all([
      getLifecycleDistribution(),
      getHealthDistribution(),
    ]);

    return NextResponse.json({ ok: true, lifecycle, health });
  } catch (error) {
    log.error('Error obtenint distribució segments', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint distribució' }, { status: 500 });
  }
}
