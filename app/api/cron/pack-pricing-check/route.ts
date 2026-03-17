import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { runPackPricingCheck } from '@/lib/services/packPricingCheckService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPackPricingCheck();

    await saveCronRunStatus({
      prefix: 'automation.packPricing',
      status: 'ok',
      summary: result,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error('pack-pricing-check cron failed', error, {
      context: { requestId, endpoint: 'cron/pack-pricing-check' },
    });
    await saveCronRunStatus({
      prefix: 'automation.packPricing',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Error desconegut',
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: 'Pack pricing check failed' }, { status: 500 });
  }
}
