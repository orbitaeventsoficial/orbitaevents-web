import { prisma } from '@/lib/prisma';

export interface CachedGoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
  language?: string;
}

interface GoogleReviewsCachePayload {
  lastUpdated: string;
  rating: number;
  total: number;
  reviews: CachedGoogleReview[];
}

function upsertSetting(key: string, value: string, category: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value, category, type: 'STRING' },
  });
}

export async function writeGoogleReviewsCache(input: {
  rating: number;
  total: number;
  reviews: CachedGoogleReview[];
}) {
  const payload: GoogleReviewsCachePayload = {
    lastUpdated: new Date().toISOString(),
    rating: input.rating,
    total: input.total,
    reviews: input.reviews,
  };

  const reviewsJson = JSON.stringify(payload);

  await Promise.all([
    upsertSetting('cache.googleReviews', reviewsJson, 'cache'),
    upsertSetting('stats.googleRating', String(input.rating), 'stats'),
    upsertSetting('stats.googleReviewCount', String(input.total), 'stats'),
  ]);

  return payload;
}

export async function readGoogleReviewsCache(): Promise<GoogleReviewsCachePayload | null> {
  try {
    const cached = await prisma.setting.findUnique({ where: { key: 'cache.googleReviews' } });
    if (!cached?.value) return null;
    const data = JSON.parse(cached.value) as GoogleReviewsCachePayload;
    if (!data || !Array.isArray(data.reviews)) return null;
    return data;
  } catch {
    return null;
  }
}