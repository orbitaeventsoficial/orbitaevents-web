import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { runCommercialDailyAutomation } from '@/lib/services/commercialDailyAutomationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per commercial-daily', undefined, {
      context: { requestId, endpoint: 'cron/commercial-daily:isAuthorized' },
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
    const summary = await runCommercialDailyAutomation();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('commercial-daily cron failed', error, {
      context: { requestId, endpoint: 'cron/commercial-daily:GET' },
    });
    await saveCronRunStatus({
      prefix: 'automation.commercial',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      category: 'config',
    });
    return NextResponse.json({ ok: false, error: 'Cron commercial-daily failed' }, { status: 500 });
  }
}