import { describe, it, expect } from 'vitest';
import {
  computePlatformMetrics,
  computeConsistencyScore,
  generateRecommendations,
  generateSocialPerformanceReport,
  type SocialPostSnapshot,
  type PlatformMetrics,
} from '@/lib/services/socialPerformanceService';

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date('2026-06-15T10:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

function makePost(overrides: Partial<SocialPostSnapshot> = {}): SocialPostSnapshot {
  return {
    id: `post-${Math.random().toString(36).slice(2, 8)}`,
    platforms: ['INSTAGRAM'],
    status: 'PUBLISHED',
    contentType: 'IMAGE',
    category: 'EVENT_SHOWCASE',
    scheduledAt: null,
    publishedAt: daysAgo(5),
    createdAt: daysAgo(10),
    ...overrides,
  };
}

// ── computePlatformMetrics ─────────────────────────────────────────────────

describe('computePlatformMetrics', () => {
  it('compta posts per estat', () => {
    const posts = [
      makePost({ status: 'PUBLISHED' }),
      makePost({ status: 'PUBLISHED' }),
      makePost({ status: 'SCHEDULED' }),
      makePost({ status: 'IDEA' }),
      makePost({ status: 'DRAFT' }),
    ];

    const result = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);

    expect(result.totalPosts).toBe(5);
    expect(result.published).toBe(2);
    expect(result.scheduled).toBe(1);
    expect(result.ideas).toBe(1);
    expect(result.drafts).toBe(1);
  });

  it('filtra per plataforma', () => {
    const posts = [
      makePost({ platforms: ['INSTAGRAM'] }),
      makePost({ platforms: ['TIKTOK'] }),
      makePost({ platforms: ['INSTAGRAM', 'TIKTOK'] }),
    ];

    const igResult = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);
    const tkResult = computePlatformMetrics(posts, 'TIKTOK', 90, now);

    expect(igResult.totalPosts).toBe(2);
    expect(tkResult.totalPosts).toBe(2);
  });

  it('calcula breakdown per contentType', () => {
    const posts = [
      makePost({ contentType: 'IMAGE' }),
      makePost({ contentType: 'IMAGE' }),
      makePost({ contentType: 'REEL' }),
    ];

    const result = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);

    expect(result.contentTypeBreakdown.IMAGE).toBe(2);
    expect(result.contentTypeBreakdown.REEL).toBe(1);
  });

  it('calcula breakdown per categoria', () => {
    const posts = [
      makePost({ category: 'EVENT_SHOWCASE' }),
      makePost({ category: 'EVENT_SHOWCASE' }),
      makePost({ category: 'PROMO' }),
      makePost({ category: null }),
    ];

    const result = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);

    expect(result.categoryBreakdown.EVENT_SHOWCASE).toBe(2);
    expect(result.categoryBreakdown.PROMO).toBe(1);
    expect(result.categoryBreakdown['null']).toBeUndefined();
  });

  it('determina millor dia i hora de publicació', () => {
    // 3 posts dilluns a les 18h, 1 post dimarts a les 10h
    const monday18 = new Date('2026-06-08T18:00:00Z'); // dilluns
    const tuesday10 = new Date('2026-06-09T10:00:00Z'); // dimarts

    const posts = [
      makePost({ publishedAt: monday18 }),
      makePost({ publishedAt: monday18 }),
      makePost({ publishedAt: monday18 }),
      makePost({ publishedAt: tuesday10 }),
    ];

    const result = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);

    expect(result.bestDay).toBe('dl'); // dilluns
    expect(result.bestHour).toBe(18);
  });

  it('calcula avgPostsPerWeek', () => {
    const posts = [
      makePost({ status: 'PUBLISHED' }),
      makePost({ status: 'PUBLISHED' }),
      makePost({ status: 'PUBLISHED' }),
    ];

    // 90 dies = ~12.86 setmanes → 3/12.86 ≈ 0.23
    const result = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);

    expect(result.avgPostsPerWeek).toBeGreaterThan(0);
    expect(result.avgPostsPerWeek).toBeLessThan(1);
  });

  it('calcula daysSinceLastPost', () => {
    const posts = [
      makePost({ publishedAt: daysAgo(3), status: 'PUBLISHED' }),
      makePost({ publishedAt: daysAgo(10), status: 'PUBLISHED' }),
    ];

    const result = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);

    expect(result.daysSinceLastPost).toBe(3);
  });

  it('retorna nulls sense posts publicats', () => {
    const posts = [makePost({ status: 'IDEA' })];

    const result = computePlatformMetrics(posts, 'INSTAGRAM', 90, now);

    expect(result.bestDay).toBeNull();
    expect(result.bestHour).toBeNull();
    expect(result.daysSinceLastPost).toBeNull();
    expect(result.lastPublishedAt).toBeNull();
  });
});

// ── computeConsistencyScore ────────────────────────────────────────────────

describe('computeConsistencyScore', () => {
  it('retorna 0 sense posts publicats', () => {
    expect(computeConsistencyScore([], 90, now)).toBe(0);
  });

  it('retorna 100 si cada setmana té publicació (4 setmanes)', () => {
    const posts = [
      makePost({ publishedAt: daysAgo(3), status: 'PUBLISHED' }),
      makePost({ publishedAt: daysAgo(10), status: 'PUBLISHED' }),
      makePost({ publishedAt: daysAgo(17), status: 'PUBLISHED' }),
      makePost({ publishedAt: daysAgo(24), status: 'PUBLISHED' }),
    ];

    const score = computeConsistencyScore(posts, 28, now);

    expect(score).toBe(100);
  });

  it('retorna ~50 si la meitat de setmanes tenen publicació', () => {
    const posts = [
      makePost({ publishedAt: daysAgo(3), status: 'PUBLISHED' }),
      makePost({ publishedAt: daysAgo(24), status: 'PUBLISHED' }),
    ];

    const score = computeConsistencyScore(posts, 28, now);

    // 4 setmanes, 2 amb posts = 50%
    expect(score).toBe(50);
  });
});

// ── generateRecommendations ────────────────────────────────────────────────

describe('generateRecommendations', () => {
  it('recomana consistència si score baix', () => {
    const recs = generateRecommendations([], 30);

    expect(recs.some((r) => r.includes('consistència'))).toBe(true);
  });

  it('alerta de plataforma inactiva', () => {
    const metrics: PlatformMetrics[] = [
      {
        platform: 'INSTAGRAM',
        totalPosts: 5,
        published: 3,
        scheduled: 0,
        ideas: 2,
        drafts: 0,
        contentTypeBreakdown: { IMAGE: 3 },
        categoryBreakdown: {},
        publishedByDayOfWeek: [0, 0, 0, 0, 0, 0, 0],
        publishedByHour: new Array(24).fill(0),
        bestDay: null,
        bestHour: null,
        avgPostsPerWeek: 0.5,
        lastPublishedAt: daysAgo(20),
        daysSinceLastPost: 20,
      },
    ];

    const recs = generateRecommendations(metrics, 60);

    expect(recs.some((r) => r.includes('INSTAGRAM') && r.includes('20 dies'))).toBe(true);
  });

  it('recomana diversificar contingut si un sol tipus', () => {
    const metrics: PlatformMetrics[] = [
      {
        platform: 'TIKTOK',
        totalPosts: 5,
        published: 5,
        scheduled: 0,
        ideas: 0,
        drafts: 0,
        contentTypeBreakdown: { VIDEO: 5 },
        categoryBreakdown: {},
        publishedByDayOfWeek: [0, 0, 0, 0, 0, 0, 0],
        publishedByHour: new Array(24).fill(0),
        bestDay: null,
        bestHour: null,
        avgPostsPerWeek: 2,
        lastPublishedAt: daysAgo(2),
        daysSinceLastPost: 2,
      },
    ];

    const recs = generateRecommendations(metrics, 80);

    expect(recs.some((r) => r.includes('VIDEO') && r.includes('Diversifica'))).toBe(true);
  });

  it('alerta de plataforma amb posts però cap publicat', () => {
    const metrics: PlatformMetrics[] = [
      {
        platform: 'FACEBOOK',
        totalPosts: 3,
        published: 0,
        scheduled: 1,
        ideas: 1,
        drafts: 1,
        contentTypeBreakdown: {},
        categoryBreakdown: {},
        publishedByDayOfWeek: [0, 0, 0, 0, 0, 0, 0],
        publishedByHour: new Array(24).fill(0),
        bestDay: null,
        bestHour: null,
        avgPostsPerWeek: 0,
        lastPublishedAt: null,
        daysSinceLastPost: null,
      },
    ];

    const recs = generateRecommendations(metrics, 80);

    expect(recs.some((r) => r.includes('FACEBOOK') && r.includes('0 publicats'))).toBe(true);
  });
});

// ── generateSocialPerformanceReport ────────────────────────────────────────

describe('generateSocialPerformanceReport', () => {
  it('genera report complet amb mètriques per plataforma', () => {
    const posts = [
      makePost({ platforms: ['INSTAGRAM'], status: 'PUBLISHED', publishedAt: daysAgo(3) }),
      makePost({ platforms: ['INSTAGRAM'], status: 'PUBLISHED', publishedAt: daysAgo(10) }),
      makePost({ platforms: ['TIKTOK'], status: 'PUBLISHED', publishedAt: daysAgo(5) }),
      makePost({ platforms: ['INSTAGRAM'], status: 'IDEA' }),
    ];

    const report = generateSocialPerformanceReport({ posts, windowDays: 90, now });

    expect(report.totalPosts).toBe(4);
    expect(report.totalPublished).toBe(3);
    expect(report.platformMetrics).toHaveLength(2);
    expect(report.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(report.overallAvgPerWeek).toBeGreaterThan(0);
  });

  it('ordena plataformes per publicats desc', () => {
    const posts = [
      makePost({ platforms: ['TIKTOK'], status: 'PUBLISHED' }),
      makePost({ platforms: ['TIKTOK'], status: 'PUBLISHED' }),
      makePost({ platforms: ['TIKTOK'], status: 'PUBLISHED' }),
      makePost({ platforms: ['INSTAGRAM'], status: 'PUBLISHED' }),
    ];

    const report = generateSocialPerformanceReport({ posts, windowDays: 90, now });

    expect(report.platformMetrics[0].platform).toBe('TIKTOK');
    expect(report.platformMetrics[1].platform).toBe('INSTAGRAM');
  });

  it('genera recomanacions quan cal', () => {
    const posts = [
      makePost({ platforms: ['INSTAGRAM'], status: 'PUBLISHED', publishedAt: daysAgo(30) }),
    ];

    const report = generateSocialPerformanceReport({ posts, windowDays: 90, now });

    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('report buit sense posts', () => {
    const report = generateSocialPerformanceReport({ posts: [], windowDays: 90, now });

    expect(report.totalPosts).toBe(0);
    expect(report.totalPublished).toBe(0);
    expect(report.platformMetrics).toHaveLength(0);
    expect(report.consistencyScore).toBe(0);
  });
});
