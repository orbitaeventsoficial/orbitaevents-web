import { NextResponse } from 'next/server';
import { buildPipelineForecast } from '@/lib/services/pipelineForecast';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const forecast = await buildPipelineForecast(6);
    return NextResponse.json({ ok: true, forecast });
  } catch (error) {
    log.error('pipeline forecast failed', error);
    return NextResponse.json({ ok: false, error: 'Error generant previsió de vendes' }, { status: 500 });
  }
}
