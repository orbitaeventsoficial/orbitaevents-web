import { NextRequest, NextResponse } from 'next/server';
import { buildCashFlowForecast } from '@/lib/services/cashFlowForecast';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const cashFlow = await buildCashFlowForecast(6);
    return NextResponse.json({ ok: true, cashFlow });
  } catch (error) {
    log.error('cash-flow forecast failed', error);
    return NextResponse.json({ ok: false, error: 'Error generant previsió de tresoreria' }, { status: 500 });
  }
}
