import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockCachedQuery, mockIsBuildPrerenderPhase } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findMany: vi.fn() },
    booking: { count: vi.fn() },
  },
  mockCachedQuery: vi.fn(),
  mockIsBuildPrerenderPhase: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/query-cache', () => ({
  CacheTTL: { LONG: 60_000 },
  cachedQuery: mockCachedQuery,
}));
vi.mock('@/lib/build-phase', () => ({ isBuildPrerenderPhase: mockIsBuildPrerenderPhase }));

import {
  getPublicStats,
  getPublicStatsLocale,
  getFallbackPublicStats,
} from '@/lib/services/publicStatsService';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
  mockIsBuildPrerenderPhase.mockReturnValue(false);
  mockCachedQuery.mockImplementation((_key: string, loader: () => unknown) => loader());
  mockPrisma.setting.findMany.mockResolvedValue([]);
  mockPrisma.booking.count.mockResolvedValue(0);
});

describe('getPublicStatsLocale', () => {
  it('retorna es per defecte', () => {
    expect(getPublicStatsLocale(null)).toBe('es');
  });

  it('retorna es per valor invàlid', () => {
    expect(getPublicStatsLocale('fr')).toBe('es');
  });

  it('retorna ca si es passa ca', () => {
    expect(getPublicStatsLocale('ca')).toBe('ca');
  });

  it('retorna en si es passa en', () => {
    expect(getPublicStatsLocale('en')).toBe('en');
  });

  it('retorna es si es passa es', () => {
    expect(getPublicStatsLocale('es')).toBe('es');
  });
});

describe('getFallbackPublicStats', () => {
  it('retorna estructura completa en ca', () => {
    const result = getFallbackPublicStats('ca');

    expect(result.coverage).toBe('Barcelona + Girona');
    expect(result.responseTime).toBe('2h');
    expect(result.yearStarted).toBe(2023);
    expect(result.peopleEntertained).toBe(0);
    expect(result.technicalIncidents).toBe(0);
    expect(result.totalEvents).toBe(0);
    expect(result.totalWeddings).toBe(0);
    expect(result.totalCorporate).toBe(0);
    expect(result.totalParties).toBe(0);
    expect(result.averageRating).toBe(0);
    expect(result.googleRating).toBeNull();
    expect(result.googleReviewsCount).toBeNull();
  });

  it('yearsExperience en català', () => {
    const result = getFallbackPublicStats('ca');
    expect(result.yearsExperience).toContain('anys');
  });

  it('yearsExperience en castellà', () => {
    const result = getFallbackPublicStats('es');
    expect(result.yearsExperience).toContain('años');
  });

  it('yearsExperience en anglès', () => {
    const result = getFallbackPublicStats('en');
    expect(result.yearsExperience).toContain('years');
  });

  it('anys calculats dinàmicament', () => {
    const result = getFallbackPublicStats('ca');
    const currentYear = new Date().getFullYear();
    const expectedYears = currentYear - 2023;
    expect(result.yearsExperience).toContain(String(expectedYears));
  });

  it('cobertura idèntica en tots els idiomes', () => {
    expect(getFallbackPublicStats('ca').coverage).toBe('Barcelona + Girona');
    expect(getFallbackPublicStats('es').coverage).toBe('Barcelona + Girona');
    expect(getFallbackPublicStats('en').coverage).toBe('Barcelona + Girona');
  });
});

describe('getPublicStats', () => {
  it('respecta les claus que escriu /admin/stats en el servei públic', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'stats.events_completed', value: '120' },
      { key: 'stats.people_entertained', value: '9000' },
      { key: 'stats.years_experience', value: '12' },
      { key: 'stats.rating_average', value: '4.7' },
      { key: 'stats.googleReviewCount', value: '321' },
    ]);
    mockPrisma.booking.count
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(7);

    const result = await getPublicStats('ca');

    expect(result.ok).toBe(true);
    expect(result.stats.totalEvents).toBe(120);
    expect(result.stats.peopleEntertained).toBe(9000);
    expect(result.stats.yearsExperience).toContain('12 anys');
    expect(result.stats.averageRating).toBe(4.7);
    expect(result.stats.googleRating).toBe(4.7);
    expect(result.stats.googleReviewsCount).toBe(321);
  });
});
