import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { buildProfitabilityReport } from '@/lib/services/profitabilityService';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const report = await buildProfitabilityReport();
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    log.error('Error generating profitability report', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut generar l\'informe de rendibilitat' },
      { status: 500 }
    );
  }
}
