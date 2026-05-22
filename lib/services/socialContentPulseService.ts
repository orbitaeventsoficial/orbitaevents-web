import { prisma } from '@/lib/prisma';
import { computeConsistencyScore, type SocialPostSnapshot } from './socialPerformanceService';

export type SocialContentPulse = {
  windowDays: number;
  postsLast30d: number;
  publishedLast30d: number;
  scheduledUpcoming: number;
  draftsPending: number;
  daysSinceLastPost: number | null;
  isActive: boolean;
  consistencyScore: number;
  instagramLeadCount: number;
  instagramWonCount: number;
};

export async function loadSocialContentPulse(windowDays = 30): Promise<SocialContentPulse> {
  const now = new Date();
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const [posts, scheduledCount, instagramLeads] = await Promise.all([
    prisma.socialPost.findMany({
      where: { createdAt: { gte: since } },
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
    }),
    prisma.socialPost.count({
      where: { status: 'SCHEDULED', scheduledAt: { gt: now } },
    }),
    prisma.lead.groupBy({
      by: ['status'],
      where: { source: 'INSTAGRAM' },
      _count: true,
    }),
  ]);

  const snapshots: SocialPostSnapshot[] = posts.map((p) => ({
    id: p.id,
    platforms: Array.isArray(p.platforms) ? (p.platforms as string[]) : [],
    status: p.status,
    contentType: p.contentType,
    category: p.category,
    scheduledAt: p.scheduledAt,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
  }));

  const published = snapshots.filter((p) => p.status === 'PUBLISHED');
  const drafts = snapshots.filter((p) => p.status === 'DRAFT');

  let lastPublishedAt: Date | null = null;
  for (const p of published) {
    const date = p.publishedAt ?? p.createdAt;
    if (!lastPublishedAt || date > lastPublishedAt) lastPublishedAt = date;
  }

  const daysSinceLastPost = lastPublishedAt
    ? Math.floor((now.getTime() - lastPublishedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const consistencyScore = computeConsistencyScore(published, windowDays, now);

  const instagramLeadCount = instagramLeads.reduce((sum, g) => sum + g._count, 0);
  const instagramWonCount = instagramLeads.find((g) => g.status === 'WON')?._count ?? 0;

  return {
    windowDays,
    postsLast30d: posts.length,
    publishedLast30d: published.length,
    scheduledUpcoming: scheduledCount,
    draftsPending: drafts.length,
    daysSinceLastPost,
    isActive: published.length > 0,
    consistencyScore,
    instagramLeadCount,
    instagramWonCount,
  };
}
