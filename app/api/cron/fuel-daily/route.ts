import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { runFuelDailyRefresh } from '@/lib/services/fuelReferenceService';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per fuel-daily', undefined, {
      context: { requestId, endpoint: 'cron/fuel-daily:isAuthorized' },
    });
    return false;
  }
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!isAuthorized(request, requestId)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await runFuelDailyRefresh();
    await saveCronRunStatus({ prefix: 'automation.fuel', status: 'ok', summary, category: 'finance' });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('fuel-daily cron failed', error, {
      context: { requestId, endpoint: 'cron/fuel-daily:GET' },
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    await saveCronRunStatus({ prefix: 'automation.fuel', status: 'error', summary: {}, message, category: 'finance' });
    return NextResponse.json({ ok: false, error: 'Cron fuel-daily failed' }, { status: 500 });
  }
}
