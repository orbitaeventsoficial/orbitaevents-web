/**
 * Reviews Sync Service
 * Sincronitza ressenyes de Google via SerpAPI i les guarda a BD.
 * Usat tant pel cron HTTP com pel scheduler intern.
 */

import { writeGoogleReviewsCache, type CachedGoogleReview } from './googleReviewsCacheService';
import { saveCronRunStatus } from './cronRunStatusService';
import { log } from '@/lib/logger';

const PLACE_ID = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || 'ChIJe39Xr8t/iUcRdyBu8A2xdLM';

export async function fetchFromSerpAPI(): Promise<{
  rating: number;
  total: number;
  reviews: CachedGoogleReview[];
} | null> {
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

  const reviews: CachedGoogleReview[] = (reviewsData.reviews || []).map((r: Record<string, unknown>) => ({
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

export async function syncReviews(): Promise<void> {
  try {
    const data = await fetchFromSerpAPI();

    if (!data) {
      log.warn('reviews-sync (scheduler): No s\'han pogut obtenir ressenyes de SerpAPI');
      return;
    }

    await writeGoogleReviewsCache({
      rating: data.rating,
      total: data.total,
      reviews: data.reviews,
    });

    log.info(`reviews-sync (scheduler): ${data.reviews.length} ressenyes sincronitzades (${data.total} total, ${data.rating}★)`);

    await saveCronRunStatus({
      prefix: 'automation.reviewsSync',
      status: 'ok',
      summary: { rating: data.rating, total: data.total, synced: data.reviews.length },
    });
  } catch (error) {
    log.error('reviews-sync (scheduler): Error', error instanceof Error ? error : undefined);
    await saveCronRunStatus({
      prefix: 'automation.reviewsSync',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Error intern',
    }).catch(() => {});
  }
}
