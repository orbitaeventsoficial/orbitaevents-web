import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    socialPost: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    lead: {
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { loadSocialContentPulse } from '@/lib/services/socialContentPulseService';

const now = new Date('2026-05-12T10:00:00Z');

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(now);
  mockPrisma.socialPost.findMany.mockResolvedValue([]);
  mockPrisma.socialPost.count.mockResolvedValue(0);
  mockPrisma.lead.groupBy.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('loadSocialContentPulse', () => {
  it('retorna pols buit quan no hi ha posts', async () => {
    const result = await loadSocialContentPulse();

    expect(result.postsLast30d).toBe(0);
    expect(result.publishedLast30d).toBe(0);
    expect(result.draftsPending).toBe(0);
    expect(result.scheduledUpcoming).toBe(0);
    expect(result.daysSinceLastPost).toBeNull();
    expect(result.isActive).toBe(false);
    expect(result.consistencyScore).toBe(0);
    expect(result.instagramLeadCount).toBe(0);
    expect(result.instagramWonCount).toBe(0);
  });

  it('compta posts publicats i esborranys correctament', async () => {
    const published1 = { id: 'p1', platforms: ['INSTAGRAM'], status: 'PUBLISHED', contentType: 'REEL', category: null, scheduledAt: null, publishedAt: new Date('2026-05-10T12:00:00Z'), createdAt: new Date('2026-05-09T10:00:00Z') };
    const published2 = { id: 'p2', platforms: ['INSTAGRAM'], status: 'PUBLISHED', contentType: 'POST', category: 'PORTFOLIO', scheduledAt: null, publishedAt: new Date('2026-05-08T12:00:00Z'), createdAt: new Date('2026-05-07T10:00:00Z') };
    const draft = { id: 'p3', platforms: ['INSTAGRAM'], status: 'DRAFT', contentType: 'STORY', category: null, scheduledAt: null, publishedAt: null, createdAt: new Date('2026-05-11T10:00:00Z') };

    mockPrisma.socialPost.findMany.mockResolvedValue([published1, published2, draft]);
    mockPrisma.socialPost.count.mockResolvedValue(2);

    const result = await loadSocialContentPulse();

    expect(result.postsLast30d).toBe(3);
    expect(result.publishedLast30d).toBe(2);
    expect(result.draftsPending).toBe(1);
    expect(result.scheduledUpcoming).toBe(2);
    expect(result.isActive).toBe(true);
  });

  it('calcula daysSinceLastPost des del publishedAt més recent', async () => {
    const older = { id: 'p1', platforms: ['INSTAGRAM'], status: 'PUBLISHED', contentType: 'POST', category: null, scheduledAt: null, publishedAt: new Date('2026-05-05T12:00:00Z'), createdAt: new Date('2026-05-04T10:00:00Z') };
    const newer = { id: 'p2', platforms: ['INSTAGRAM'], status: 'PUBLISHED', contentType: 'POST', category: null, scheduledAt: null, publishedAt: new Date('2026-05-10T12:00:00Z'), createdAt: new Date('2026-05-09T10:00:00Z') };

    mockPrisma.socialPost.findMany.mockResolvedValue([older, newer]);

    const result = await loadSocialContentPulse();

    expect(result.daysSinceLastPost).toBe(1);
  });

  it('usa createdAt si publishedAt és null', async () => {
    const post = { id: 'p1', platforms: ['INSTAGRAM'], status: 'PUBLISHED', contentType: 'POST', category: null, scheduledAt: null, publishedAt: null, createdAt: new Date('2026-05-11T10:00:00Z') };

    mockPrisma.socialPost.findMany.mockResolvedValue([post]);

    const result = await loadSocialContentPulse();

    expect(result.daysSinceLastPost).toBe(1);
  });

  it('compta instagramLeadCount i instagramWonCount des de lead.groupBy', async () => {
    mockPrisma.lead.groupBy.mockResolvedValue([
      { status: 'NEW', _count: 5 },
      { status: 'WON', _count: 3 },
      { status: 'LOST', _count: 2 },
    ]);

    const result = await loadSocialContentPulse();

    expect(result.instagramLeadCount).toBe(10);
    expect(result.instagramWonCount).toBe(3);
  });

  it('instagramWonCount és 0 si no hi ha leads WON', async () => {
    mockPrisma.lead.groupBy.mockResolvedValue([
      { status: 'NEW', _count: 4 },
    ]);

    const result = await loadSocialContentPulse();

    expect(result.instagramLeadCount).toBe(4);
    expect(result.instagramWonCount).toBe(0);
  });

  it('respecta el windowDays personalitzat', async () => {
    await loadSocialContentPulse(7);

    const call = mockPrisma.socialPost.findMany.mock.calls[0][0];
    const since = call.where.createdAt.gte as Date;
    const diffDays = Math.round((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
    expect((await loadSocialContentPulse(7)).windowDays).toBe(7);
  });

  it('omple plataformes com a array buit si el camp no és array', async () => {
    const post = { id: 'p1', platforms: null, status: 'PUBLISHED', contentType: 'POST', category: null, scheduledAt: null, publishedAt: new Date('2026-05-10T12:00:00Z'), createdAt: new Date('2026-05-09T10:00:00Z') };
    mockPrisma.socialPost.findMany.mockResolvedValue([post]);

    await expect(loadSocialContentPulse()).resolves.not.toThrow();
  });
});
