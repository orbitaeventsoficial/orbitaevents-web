import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { PUBLIC_STATS_CACHE_HEADERS, PUBLIC_STATS_COMPANY_START_YEAR, PUBLIC_STATS_LOCALE_TEXT, SUPPORTED_LOCALES as SHARED_SUPPORTED_LOCALES } from '@/lib/constants';
import { isBuildPrerenderPhase } from '@/lib/build-phase';

export type PublicStatsLocale = 'es' | 'ca' | 'en';

const SUPPORTED_LOCALES = new Set<PublicStatsLocale>(SHARED_SUPPORTED_LOCALES);
export function getPublicStatsLocale(value: string | null): PublicStatsLocale {
  return value && SUPPORTED_LOCALES.has(value as PublicStatsLocale) ? (value as PublicStatsLocale) : 'es';
}

function formatYearsExperience(locale: PublicStatsLocale, yearsCount: number): string {
  return `+${yearsCount} ${PUBLIC_STATS_LOCALE_TEXT[locale].yearsSuffix}`;
}

export function getFallbackPublicStats(locale: PublicStatsLocale) {
  const startDate = new Date(Date.UTC(PUBLIC_STATS_COMPANY_START_YEAR, 0, 1));
  const yearsCount = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));

  return {
    yearsExperience: formatYearsExperience(locale, yearsCount),
    coverage: PUBLIC_STATS_LOCALE_TEXT[locale].coverage,
    responseTime: '2h',
    yearStarted: PUBLIC_STATS_COMPANY_START_YEAR,
    peopleEntertained: 0,
    technicalIncidents: 0,
    totalEvents: 0,
    totalWeddings: 0,
    totalCorporate: 0,
    totalParties: 0,
    averageRating: 0,
    googleRating: null,
    googleReviewsCount: null,
  };
}

export async function getPublicStats(locale: PublicStatsLocale) {
  const fallbackStats = getFallbackPublicStats(locale);

  if (!process.env.DATABASE_URL || isBuildPrerenderPhase()) {
    return { ok: true as const, stats: fallbackStats, generatedAt: new Date().toISOString(), source: 'fallback' as const };
  }

  const { prisma } = await import('@/lib/prisma');
  const settings = await cachedQuery(
    'public:stats:settings',
    () => prisma.setting.findMany({ where: { category: 'stats' } }),
    CacheTTL.LONG
  );

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  const [totalEvents, weddingCount, corporateCount, partyCount] = await Promise.all([
    cachedQuery('public:stats:events:total', () => prisma.booking.count({ where: { status: 'COMPLETED' } }), CacheTTL.LONG),
    cachedQuery('public:stats:events:weddings', () => prisma.booking.count({ where: { status: 'COMPLETED', eventType: 'WEDDING' } }), CacheTTL.LONG),
    cachedQuery('public:stats:events:corporate', () => prisma.booking.count({ where: { status: 'COMPLETED', eventType: 'CORPORATE' } }), CacheTTL.LONG),
    cachedQuery('public:stats:events:parties', () => prisma.booking.count({ where: { status: 'COMPLETED', eventType: { in: ['BIRTHDAY', 'PRIVATE_PARTY', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY'] } } }), CacheTTL.LONG),
  ]);

  const yearStartedSetting = parseInt(settingsMap['stats.yearStarted'] || String(PUBLIC_STATS_COMPANY_START_YEAR), 10);
  const yearStarted = Number.isNaN(yearStartedSetting) ? PUBLIC_STATS_COMPANY_START_YEAR : yearStartedSetting;
  const startDate = new Date(Date.UTC(yearStarted, 0, 1));
  const yearsCount = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
  const yearsExperience = formatYearsExperience(locale, yearsCount);
  const coverage = settingsMap['coverage'] || PUBLIC_STATS_LOCALE_TEXT[locale].coverage;
  const responseTime = settingsMap['response_time'] || '2h';
  const googleRating = settingsMap['google_rating'] ? parseFloat(settingsMap['google_rating']) : 5.0;
  const googleReviewsCount = settingsMap['google_reviews_count'] ? parseInt(settingsMap['google_reviews_count']) : 1;
  const minEvents = parseInt(settingsMap['stats.eventsCompleted'] || String(fallbackStats.totalEvents), 10);
  const peopleEntertainedSetting = parseInt(settingsMap['stats.peopleEntertained'] || String(fallbackStats.peopleEntertained), 10);
  const technicalIncidentsSetting = parseInt(settingsMap['stats.technicalIncidents'] || String(fallbackStats.technicalIncidents), 10);

  return {
    ok: true as const,
    stats: {
      yearsExperience,
      coverage,
      responseTime,
      yearStarted,
      peopleEntertained: Number.isNaN(peopleEntertainedSetting) ? fallbackStats.peopleEntertained : peopleEntertainedSetting,
      technicalIncidents: Number.isNaN(technicalIncidentsSetting) ? fallbackStats.technicalIncidents : technicalIncidentsSetting,
      totalEvents: Math.max(totalEvents || 0, Number.isNaN(minEvents) ? fallbackStats.totalEvents : minEvents),
      totalWeddings: weddingCount || fallbackStats.totalWeddings,
      totalCorporate: corporateCount || fallbackStats.totalCorporate,
      totalParties: partyCount || fallbackStats.totalParties,
      averageRating: Math.round(googleRating * 10) / 10,
      googleRating,
      googleReviewsCount,
    },
    generatedAt: new Date().toISOString(),
  };
}
