import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { runLeadReengagementAutomation } from '@/lib/services/tasks/leadReengagementAutomationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per lead-reengagement', undefined, {
      context: { requestId, endpoint: 'cron/lead-reengagement:isAuthorized' },
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
    const result = await runLeadReengagementAutomation();
    const summary = {
      candidates: result.candidates,
      proposed: result.proposed,
      created: result.created,
      skipped: result.skipped,
    };

    await saveCronRunStatus({
      prefix: 'automation.leadReengagement',
      status: 'ok',
      summary,
      message: `${result.created} tasques de reengagement creades de ${result.proposed} propostes (${result.skipped} duplicades, ${result.candidates} candidats totals).`,
      category: 'automation',
    });

    log.info('lead-reengagement cron completed', {
      context: { requestId, ...summary },
    });

    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    log.error('lead-reengagement cron failed', error, {
      context: { requestId, endpoint: 'cron/lead-reengagement:GET' },
    });

    await saveCronRunStatus({
      prefix: 'automation.leadReengagement',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      category: 'automation',
    });

    return NextResponse.json({ ok: false, error: 'Cron lead-reengagement failed' }, { status: 500 });
  }
}
