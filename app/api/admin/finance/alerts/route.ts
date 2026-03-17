import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { getFinanceAlertsSummary } from '@/lib/services/financeAlertsService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    return NextResponse.json(await getFinanceAlertsSummary());
  } catch (error) {
    log.error('Error obtenint alertes financeres', error, { context: { endpoint: 'GET /api/admin/finance/alerts' } });
    return NextResponse.json({ ok: false, error: 'Error obtenint alertes financeres' }, { status: 500 });
  }
}
