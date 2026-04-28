import type { PublicStatsLocale } from '@/lib/services/publicStatsService';

export type { PublicStatsLocale };

export type PublicStatsValues = {
  yearsExperience: string;
  coverage: string;
  responseTime: string;
  yearStarted: number;
  peopleEntertained: number;
  technicalIncidents: number;
  totalEvents: number;
  totalWeddings: number;
  totalCorporate: number;
  totalParties: number;
  averageRating: number;
  googleRating: number | null;
  googleReviewsCount: number | null;
};

export type PublicStatsResponse = {
  ok: boolean;
  stats: PublicStatsValues;
  generatedAt: string;
  source?: 'fallback';
};

export async function fetchPublicStats(
  locale?: string,
  init?: RequestInit,
): Promise<PublicStatsResponse> {
  const url = locale ? `/api/public/stats?locale=${encodeURIComponent(locale)}` : '/api/public/stats';
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`public-stats fetch failed (${response.status})`);
  }
  return (await response.json()) as PublicStatsResponse;
}
