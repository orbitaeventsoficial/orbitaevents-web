import { NextResponse } from 'next/server';
import { buildCashFlowForecast } from '@/lib/services/cashFlowForecast';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cashFlow = await buildCashFlowForecast(6);
    return NextResponse.json({ ok: true, cashFlow });
  } catch (error) {
    log.error('cash-flow forecast failed', error);
    return NextResponse.json({ ok: false, error: 'Error generant previsió de tresoreria' }, { status: 500 });
  }
}
