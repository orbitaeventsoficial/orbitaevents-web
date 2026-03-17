import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { getEventWeatherForecast } from '@/lib/services/weatherService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const forecasts = await getEventWeatherForecast();
    return NextResponse.json({ ok: true, forecasts });
  } catch (error) {
    log.error('Error obtenint previsions meteorològiques:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obtenint previsions meteorològiques' },
      { status: 500 }
    );
  }
}
