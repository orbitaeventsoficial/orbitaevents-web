import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { runWeeklyBenchmark } from '@/lib/services/weeklyBenchmarkService';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per weekly-benchmark', undefined, {
      context: { requestId, endpoint: 'cron/weekly-benchmark:isAuthorized' },
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
    const report = await runWeeklyBenchmark();
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    log.error('weekly-benchmark cron failed', error, {
      context: { requestId, endpoint: 'cron/weekly-benchmark:GET' },
    });
    await saveCronRunStatus({
      prefix: 'benchmark.weekly',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      category: 'config',
    });
    return NextResponse.json({ ok: false, error: 'Weekly benchmark failed' }, { status: 500 });
  }
}
