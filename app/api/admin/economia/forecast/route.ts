import { NextRequest, NextResponse } from 'next/server';
import { buildPipelineForecast } from '@/lib/services/pipelineForecast';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const forecast = await buildPipelineForecast(6);
    return NextResponse.json({ ok: true, forecast });
  } catch (error) {
    log.error('pipeline forecast failed', error);
    return NextResponse.json({ ok: false, error: 'Error generant previsió de vendes' }, { status: 500 });
  }
}
