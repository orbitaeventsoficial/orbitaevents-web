import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { getPackPricingAlertsCount } from '@/lib/services/packPricingHealth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const count = await getPackPricingAlertsCount();
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    log.error('Error obtenint alertes de preus de packs', error, { context: { endpoint: 'GET /api/admin/packs/price-alerts' } });
    return NextResponse.json({ ok: false, error: 'Error obtenint alertes preus packs' }, { status: 500 });
  }
}
