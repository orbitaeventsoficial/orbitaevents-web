import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { reconcileGoogleCalendar } from '@/lib/services/googleCalendarSyncService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per calendar-sync', undefined, {
      context: { requestId, endpoint: 'cron/calendar-sync:isAuthorized' },
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
    const summary = await reconcileGoogleCalendar();
    const status = summary.failed > 0 ? 'error' : 'ok';
    const message = summary.connected
      ? `${summary.synced} events sincronitzats, ${summary.deleted} eliminats, ${summary.failed} errors`
      : 'Google Calendar pendent de connexió OAuth';
    await saveCronRunStatus({
      prefix: 'automation.calendarSync',
      status,
      summary,
      message,
      category: 'automation',
    });
    return NextResponse.json({ ok: summary.failed === 0, summary }, { status: summary.failed > 0 ? 500 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('calendar-sync cron failed', error, {
      context: { requestId, endpoint: 'cron/calendar-sync:GET' },
    });
    await saveCronRunStatus({
      prefix: 'automation.calendarSync',
      status: 'error',
      summary: {},
      message,
      category: 'automation',
    });
    return NextResponse.json({ ok: false, error: 'Cron calendar-sync failed' }, { status: 500 });
  }
}
