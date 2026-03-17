import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getFallbackPublicStats, getPublicStats, getPublicStatsLocale, PUBLIC_STATS_CACHE_HEADERS } from '@/lib/services/publicStatsService';

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = getPublicStatsLocale(searchParams.get('locale'));
  const fallbackStats = getFallbackPublicStats(locale);

  try {
    return NextResponse.json(await getPublicStats(locale), { headers: PUBLIC_STATS_CACHE_HEADERS });
  } catch (error) {
    log.error('Error obteniendo stats:', error);
    return NextResponse.json({ ok: true, stats: fallbackStats, generatedAt: new Date().toISOString(), source: 'fallback' }, { headers: PUBLIC_STATS_CACHE_HEADERS });
  }
}