import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { recalculateAllCustomers } from '@/lib/services/customerSegmentationService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per customer-lifecycle', undefined, {
      context: { requestId, endpoint: 'cron/customer-lifecycle:isAuthorized' },
    });
    return false;
  }
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * CRON: customer-lifecycle
 * Recalcula healthScore i lifecycleStage de tots els clients.
 * Freqüència recomanada: diari (matinada).
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!isAuthorized(request, requestId)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await recalculateAllCustomers();

    await saveCronRunStatus({
      prefix: 'crm.customer-lifecycle',
      status: 'ok',
      summary: result,
      message: `${result.processed} clients processats, ${result.lifecycleChanges} canvis lifecycle, ${result.healthUpdates} scores actualitzats`,
      category: 'config',
    });

    log.info('customer-lifecycle cron completed', {
      context: { requestId, ...result },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error('customer-lifecycle cron failed', error, {
      context: { requestId, endpoint: 'cron/customer-lifecycle:GET' },
    });
    await saveCronRunStatus({
      prefix: 'crm.customer-lifecycle',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Unknown error',
      category: 'config',
    });
    return NextResponse.json({ ok: false, error: 'Cron customer-lifecycle failed' }, { status: 500 });
  }
}
