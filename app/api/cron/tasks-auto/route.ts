import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { runTaskAutomation } from '@/lib/services/tasks/taskAutomationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per tasks-auto', undefined, {
      context: { requestId, endpoint: 'cron/tasks-auto:isAuthorized' },
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
    const result = await runTaskAutomation();
    const summary = {
      proposed: result.proposed,
      created: result.created,
      skipped: result.skipped,
    };

    await saveCronRunStatus({
      prefix: 'automation.tasks',
      status: 'ok',
      summary,
      message: `${result.created} tasques creades de ${result.proposed} propostes (${result.skipped} duplicades)`,
      category: 'automation',
    });

    log.info('tasks-auto cron completed', {
      context: { requestId, ...summary },
    });

    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    log.error('tasks-auto cron failed', error, {
      context: { requestId, endpoint: 'cron/tasks-auto:GET' },
    });

    await saveCronRunStatus({
      prefix: 'automation.tasks',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      category: 'automation',
    });

    return NextResponse.json({ ok: false, error: 'Cron tasks-auto failed' }, { status: 500 });
  }
}
