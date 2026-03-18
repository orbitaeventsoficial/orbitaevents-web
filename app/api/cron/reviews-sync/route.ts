import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { fetchFromSerpAPI } from '@/lib/services/reviewsSyncService';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { writeGoogleReviewsCache } from '@/lib/services/googleReviewsCacheService';

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
    const data = await fetchFromSerpAPI();

    if (!data) {
      log.warn('reviews-sync: No s\'han pogut obtenir ressenyes de SerpAPI', {
        context: { requestId },
      });
      return NextResponse.json({ ok: false, error: 'SerpAPI no ha retornat resultats' });
    }

    await writeGoogleReviewsCache({
      rating: data.rating,
      total: data.total,
      reviews: data.reviews,
    });

    log.info(`reviews-sync: ${data.reviews.length} ressenyes sincronitzades (${data.total} total, ${data.rating}★)`, {
      context: { requestId },
    });

    await saveCronRunStatus({ prefix: 'automation.reviewsSync', status: 'ok', summary: { rating: data.rating, total: data.total, synced: data.reviews.length } });

    return NextResponse.json({
      ok: true,
      rating: data.rating,
      total: data.total,
      synced: data.reviews.length,
    });
  } catch (error) {
    log.error('reviews-sync: Error', error instanceof Error ? error : undefined, {
      context: { requestId },
    });
    await saveCronRunStatus({ prefix: 'automation.reviewsSync', status: 'error', summary: {}, message: error instanceof Error ? error.message : 'Error intern' }).catch(() => {});
    return NextResponse.json({ ok: false, error: 'Error intern' }, { status: 500 });
  }
}
