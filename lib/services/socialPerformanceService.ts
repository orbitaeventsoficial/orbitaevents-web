// lib/services/socialPerformanceService.ts
// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PERFORMANCE SERVICE
// Mètriques de rendiment editorial per plataforma: freqüència, distribució,
// consistència, millors horaris, recomanacions accionables.
// Part pura + wrapper Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import type { SocialPlatform, SocialContentType, SocialCategory } from '@/lib/constants';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type SocialPostSnapshot = {
  id: string;
  platforms: string[];
  status: string;
  contentType: string;
  category: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
};

export type PlatformMetrics = {
  platform: SocialPlatform;
  totalPosts: number;
  published: number;
  scheduled: number;
  ideas: number;
  drafts: number;
  contentTypeBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  publishedByDayOfWeek: number[];
  publishedByHour: number[];
  bestDay: string | null;
  bestHour: number | null;
  avgPostsPerWeek: number;
  lastPublishedAt: Date | null;
  daysSinceLastPost: number | null;
};

export type SocialPerformanceReport = {
  generatedAt: string;
  windowDays: number;
  totalPosts: number;
  totalPublished: number;
  overallAvgPerWeek: number;
  platformMetrics: PlatformMetrics[];
  consistencyScore: number;
  recommendations: string[];
};

export type SocialPerformanceInput = {
  posts: SocialPostSnapshot[];
  windowDays: number;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

const DAY_MS = 1000 * 60 * 60 * 24;
const WEEK_MS = DAY_MS * 7;

const DAY_NAMES = ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds'];

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

export function computePlatformMetrics(
  posts: SocialPostSnapshot[],
  platform: SocialPlatform,
  windowDays: number,
  now: Date,
): PlatformMetrics {
  const platformPosts = posts.filter((p) => p.platforms.includes(platform));

  const published = platformPosts.filter((p) => p.status === 'PUBLISHED');
  const scheduled = platformPosts.filter((p) => p.status === 'SCHEDULED');
  const ideas = platformPosts.filter((p) => p.status === 'IDEA');
  const drafts = platformPosts.filter((p) => p.status === 'DRAFT');

  const contentTypeBreakdown: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};
  const publishedByDayOfWeek = new Array(7).fill(0);
  const publishedByHour = new Array(24).fill(0);

  for (const post of platformPosts) {
    contentTypeBreakdown[post.contentType] = (contentTypeBreakdown[post.contentType] || 0) + 1;
    if (post.category) {
      categoryBreakdown[post.category] = (categoryBreakdown[post.category] || 0) + 1;
    }
  }

  let lastPublishedAt: Date | null = null;
  for (const post of published) {
    const pubDate = post.publishedAt ?? post.createdAt;
    const day = pubDate.getUTCDay();
    const hour = pubDate.getUTCHours();
    publishedByDayOfWeek[day]++;
    publishedByHour[hour]++;
    if (!lastPublishedAt || pubDate > lastPublishedAt) {
      lastPublishedAt = pubDate;
    }
  }

  const maxDayCount = Math.max(...publishedByDayOfWeek);
  const bestDayIndex = maxDayCount > 0 ? publishedByDayOfWeek.indexOf(maxDayCount) : -1;

  const maxHourCount = Math.max(...publishedByHour);
  const bestHourIndex = maxHourCount > 0 ? publishedByHour.indexOf(maxHourCount) : -1;

  const weeks = Math.max(windowDays / 7, 1);
  const avgPostsPerWeek = published.length / weeks;

  const daysSinceLastPost = lastPublishedAt
    ? Math.floor((now.getTime() - lastPublishedAt.getTime()) / DAY_MS)
    : null;

  return {
    platform,
    totalPosts: platformPosts.length,
    published: published.length,
    scheduled: scheduled.length,
    ideas: ideas.length,
    drafts: drafts.length,
    contentTypeBreakdown,
    categoryBreakdown,
    publishedByDayOfWeek,
    publishedByHour,
    bestDay: bestDayIndex >= 0 ? DAY_NAMES[bestDayIndex] : null,
    bestHour: bestHourIndex >= 0 ? bestHourIndex : null,
    avgPostsPerWeek: Math.round(avgPostsPerWeek * 100) / 100,
    lastPublishedAt,
    daysSinceLastPost,
  };
}

export function computeConsistencyScore(
  published: SocialPostSnapshot[],
  windowDays: number,
  now: Date,
): number {
  if (published.length === 0) return 0;

  const windowStart = new Date(now.getTime() - windowDays * DAY_MS);

  // Count posts per week
  const totalWeeks = Math.ceil(windowDays / 7);
  const weekBuckets = new Array(totalWeeks).fill(0);

  for (const post of published) {
    const pubDate = post.publishedAt ?? post.createdAt;
    if (pubDate < windowStart) continue;
    const weekIndex = Math.floor((now.getTime() - pubDate.getTime()) / WEEK_MS);
    if (weekIndex >= 0 && weekIndex < totalWeeks) {
      weekBuckets[weekIndex]++;
    }
  }

  // Consistency = % of weeks with at least 1 post
  const weeksWithPosts = weekBuckets.filter((count) => count > 0).length;
  return Math.round((weeksWithPosts / totalWeeks) * 100);
}

export function generateRecommendations(
  platformMetrics: PlatformMetrics[],
  consistencyScore: number,
): string[] {
  const recs: string[] = [];

  const active = platformMetrics.filter((p) => p.published > 0);
  const inactive = platformMetrics.filter(
    (p) => p.totalPosts > 0 && p.published === 0,
  );

  if (consistencyScore < 50) {
    recs.push(
      'La consistència de publicació és baixa. Objectiu mínim: 1 post/setmana per plataforma activa.',
    );
  }

  for (const p of active) {
    if (p.daysSinceLastPost != null && p.daysSinceLastPost > 14) {
      recs.push(
        `${p.platform}: ${p.daysSinceLastPost} dies sense publicar. Repren l'activitat per no perdre visibilitat.`,
      );
    }
    if (p.avgPostsPerWeek < 1) {
      recs.push(
        `${p.platform}: mitjana ${p.avgPostsPerWeek} posts/setmana. Recomanat mínim 2-3 per mantenir engagement.`,
      );
    }

    const types = Object.keys(p.contentTypeBreakdown);
    if (types.length === 1) {
      recs.push(
        `${p.platform}: tot el contingut és ${types[0]}. Diversifica amb altres formats (Reel, Carousel, Story).`,
      );
    }
  }

  for (const p of inactive) {
    recs.push(
      `${p.platform}: tens ${p.totalPosts} posts (${p.ideas} idees, ${p.drafts} esborranys) però 0 publicats. Publica o arxiva.`,
    );
  }

  if (active.length === 0 && platformMetrics.some((p) => p.totalPosts > 0)) {
    recs.push(
      'No hi ha cap publicació en cap plataforma. Prioritza una plataforma principal i publica contingut existent.',
    );
  }

  return recs;
}

export function generateSocialPerformanceReport(input: SocialPerformanceInput): SocialPerformanceReport {
  const allPlatforms = new Set<SocialPlatform>();
  for (const post of input.posts) {
    for (const platform of post.platforms) {
      allPlatforms.add(platform as SocialPlatform);
    }
  }

  const platformMetrics = Array.from(allPlatforms)
    .map((platform) => computePlatformMetrics(input.posts, platform, input.windowDays, input.now))
    .sort((a, b) => b.published - a.published);

  const published = input.posts.filter((p) => p.status === 'PUBLISHED');
  const consistencyScore = computeConsistencyScore(published, input.windowDays, input.now);
  const recommendations = generateRecommendations(platformMetrics, consistencyScore);

  const weeks = Math.max(input.windowDays / 7, 1);

  return {
    generatedAt: input.now.toISOString(),
    windowDays: input.windowDays,
    totalPosts: input.posts.length,
    totalPublished: published.length,
    overallAvgPerWeek: Math.round((published.length / weeks) * 100) / 100,
    platformMetrics,
    consistencyScore,
    recommendations,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER — Prisma
// ───────────────────────────────────────────────────────────────────────────

export async function loadSocialPerformanceReport(
  windowDays = 90,
  now: Date = new Date(),
): Promise<SocialPerformanceReport> {
  const windowStart = new Date(now.getTime() - windowDays * DAY_MS);

  const posts = await prisma.socialPost.findMany({
    where: {
      createdAt: { gte: windowStart },
    },
    select: {
      id: true,
      platforms: true,
      status: true,
      contentType: true,
      category: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return generateSocialPerformanceReport({
    posts: posts.map((p) => ({
      ...p,
      platforms: p.platforms as string[],
    })),
    windowDays,
    now,
  });
}
