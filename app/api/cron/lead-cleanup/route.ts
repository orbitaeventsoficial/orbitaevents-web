import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { runLeadCleanup } from '@/lib/services/leadCleanupService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per lead-cleanup', undefined, {
      context: { requestId, endpoint: 'cron/lead-cleanup:isAuthorized' },
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
    const summary = await runLeadCleanup();

    await saveCronRunStatus({
      prefix: 'lead-cleanup',
      status: 'ok',
      summary: JSON.stringify(summary),
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('lead-cleanup cron failed', error, {
      context: { requestId, endpoint: 'cron/lead-cleanup:GET' },
    });
    await saveCronRunStatus({
      prefix: 'lead-cleanup',
      status: 'error',
      summary: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { ok: false, error: 'Error executant lead cleanup' },
      { status: 500 }
    );
  }
}
