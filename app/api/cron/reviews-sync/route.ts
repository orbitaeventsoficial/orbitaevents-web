import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { runReviewsSync } from '@/lib/services/reviewsSyncService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per reviews-sync', undefined, {
      context: { requestId, endpoint: 'cron/reviews-sync:isAuthorized' },
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runReviewsSync(`reviews-sync:${requestId}`);
    return NextResponse.json(result);
  } catch (error) {
    log.error('reviews-sync: Error', error instanceof Error ? error : undefined, {
      context: { requestId },
    });
    return NextResponse.json({ ok: false, error: 'Error intern' }, { status: 500 });
  }
}
