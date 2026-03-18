/**
 * Reviews Sync Service
 * Sincronitza ressenyes de Google via SerpAPI i les guarda a BD.
 * Usat tant pel cron HTTP com pel scheduler intern.
 */

import { writeGoogleReviewsCache, readGoogleReviewsCache, type CachedGoogleReview } from './googleReviewsCacheService';
import { saveCronRunStatus } from './cronRunStatusService';
import { log } from '@/lib/logger';

const PLACE_ID = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || 'ChIJe39Xr8t/iUcRdyBu8A2xdLM';
const MAX_PAGES = 5; // Màxim 5 pàgines per evitar gastar crèdits SerpAPI

function mapReview(r: Record<string, unknown>): CachedGoogleReview {
  return {
    author_name: (r.user as Record<string, string>)?.name || 'Anònim',
    rating: (r.rating as number) || 5,
    text: (r.snippet as string) || (r.text as string) || '',
    time: r.iso_date ? new Date(r.iso_date as string).getTime() / 1000 : Date.now() / 1000,
    relative_time_description: (r.date as string) || 'Recentment',
    profile_photo_url: (r.user as Record<string, string>)?.thumbnail,
  };
}

/** Deduplicar ressenyes per autor + rating (clau única) */
function mergeReviews(existing: CachedGoogleReview[], fresh: CachedGoogleReview[]): CachedGoogleReview[] {
  const map = new Map<string, CachedGoogleReview>();
  // Existents primer (es sobreescriuen amb les noves si coincideixen)
  for (const r of existing) {
    map.set(`${r.author_name}::${r.rating}`, r);
  }
  for (const r of fresh) {
    map.set(`${r.author_name}::${r.rating}`, r);
  }
  // Ordenar per data desc
  return Array.from(map.values()).sort((a, b) => b.time - a.time);
}

export async function fetchFromSerpAPI(): Promise<{
  rating: number;
  total: number;
  reviews: CachedGoogleReview[];
} | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  // 1. Obtenir rating i total del Knowledge Graph
  const kgUrl = `https://serpapi.com/search.json?engine=google&q=orbita+events+granollers&location=Granollers,Catalonia,Spain&google_domain=google.es&hl=es&gl=es&api_key=${apiKey}`;
  const kgRes = await fetch(kgUrl);
  const kgData = await kgRes.json();

  if (!kgData.knowledge_graph) return null;

  const kg = kgData.knowledge_graph;
  const rating = (kg.rating as number) || 5;
  const total = (kg.review_count as number) || 0;

  // 2. Paginar ressenyes de Google Maps Reviews
  const allReviews: CachedGoogleReview[] = [];
  let nextPageToken: string | undefined;
  let page = 0;

  do {
    const url = nextPageToken
      ? `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${PLACE_ID}&api_key=${apiKey}&hl=es&next_page_token=${nextPageToken}`
      : `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${PLACE_ID}&api_key=${apiKey}&hl=es`;

    const res = await fetch(url);
    const data = await res.json();

    const pageReviews = (data.reviews || []).map(mapReview);
    allReviews.push(...pageReviews);

    nextPageToken = data.serpapi_pagination?.next_page_token;
    page++;

    log.info(`reviews-sync: pàgina ${page} — ${pageReviews.length} ressenyes obtingudes`);
  } while (nextPageToken && page < MAX_PAGES);

  // 3. Merge amb ressenyes existents al cache (per no perdre les antigues)
  const cached = await readGoogleReviewsCache();
  const merged = cached?.reviews
    ? mergeReviews(cached.reviews, allReviews)
    : allReviews;

  return {
    rating,
    total: Math.max(total, merged.length),
    reviews: merged,
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
