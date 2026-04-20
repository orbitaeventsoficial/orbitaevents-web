import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { runUrgentFollowUpAlerts } from '@/lib/services/urgentFollowUpAlertService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per urgent-followup-alerts', undefined, {
      context: { requestId, endpoint: 'cron/urgent-followup-alerts:isAuthorized' },
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
    const result = await runUrgentFollowUpAlerts();

    await saveCronRunStatus({
      prefix: 'alerts.urgentFollowUp',
      status: 'ok',
      summary: result,
      message: result.newAlerts > 0
        ? `${result.newAlerts} alertes enviades (${result.alreadyAlerted} suprimides)`
        : `0 alertes noves (${result.urgentDetected} urgents, tots ja alertats)`,
      category: 'alerts',
    });

    log.info('urgent-followup-alerts cron completed', {
      context: { requestId, ...result },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error('urgent-followup-alerts cron failed', error, {
      context: { requestId, endpoint: 'cron/urgent-followup-alerts:GET' },
    });

    await saveCronRunStatus({
      prefix: 'alerts.urgentFollowUp',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      category: 'alerts',
    });

    return NextResponse.json({ ok: false, error: 'Cron urgent-followup-alerts failed' }, { status: 500 });
  }
}
