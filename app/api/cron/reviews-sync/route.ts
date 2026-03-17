import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { writeGoogleReviewsCache } from '@/lib/services/googleReviewsCacheService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PLACE_ID = 'ChIJe39Xr8t/iUcRdyBu8A2xdLM';

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

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
}

async function fetchFromSerpAPI(): Promise<{ rating: number; total: number; reviews: GoogleReview[] } | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  const kgUrl = `https://serpapi.com/search.json?engine=google&q=orbita+events+granollers&location=Granollers,Catalonia,Spain&google_domain=google.es&hl=es&gl=es&api_key=${apiKey}`;
  const kgRes = await fetch(kgUrl);
  const kgData = await kgRes.json();

  if (!kgData.knowledge_graph) return null;

  const kg = kgData.knowledge_graph;
  const reviewsUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${PLACE_ID}&api_key=${apiKey}&hl=es`;
  const reviewsRes = await fetch(reviewsUrl);
  const reviewsData = await reviewsRes.json();

  const reviews: GoogleReview[] = (reviewsData.reviews || []).map((r: Record<string, unknown>) => ({
    author_name: (r.user as Record<string, string>)?.name || 'Anònim',
    rating: (r.rating as number) || 5,
    text: (r.snippet as string) || (r.text as string) || '',
    time: r.iso_date ? new Date(r.iso_date as string).getTime() / 1000 : Date.now() / 1000,
    relative_time_description: (r.date as string) || 'Recentment',
    profile_photo_url: (r.user as Record<string, string>)?.thumbnail,
  }));

  return {
    rating: (kg.rating as number) || 5,
    total: (kg.review_count as number) || reviews.length,
    reviews,
  };
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
