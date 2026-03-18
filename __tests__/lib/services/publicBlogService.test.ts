import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    blogPost: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listPublicBlogPosts,
  getPublicBlogPost,
  incrementPublicBlogPostView,
} from '@/lib/services/publicBlogService';

const MOCK_POST = {
  id: 'post-1',
  slug: 'boda-perfecta',
  isPublished: true,
  translations: [{ locale: 'ca', title: 'La boda perfecta' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.blogPost.findMany.mockResolvedValue([MOCK_POST]);
  mockPrisma.blogPost.findUnique.mockResolvedValue(MOCK_POST);
  mockPrisma.blogPost.count.mockResolvedValue(1);
  mockPrisma.blogPost.updateMany.mockResolvedValue({ count: 1 });
});

describe('listPublicBlogPosts', () => {
  it('retorna posts amb paginació', async () => {
    const result = await listPublicBlogPosts({ locale: 'ca', page: 1, limit: 10 });

    expect(result.posts).toHaveLength(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('calcula totalPages correctament', async () => {
    mockPrisma.blogPost.count.mockResolvedValue(25);

    const result = await listPublicBlogPosts({ locale: 'ca', page: 1, limit: 10 });

    expect(result.pagination.totalPages).toBe(3);
  });

  it('filtra per categoria', async () => {
    await listPublicBlogPosts({ locale: 'ca', page: 1, limit: 10, category: 'bodas' });

    expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'bodas' }),
      })
    );
  });

  it('filtra per tag', async () => {
    await listPublicBlogPosts({ locale: 'ca', page: 1, limit: 10, tag: 'dj' });

    expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tags: { has: 'dj' } }),
      })
    );
  });

  it('skip correcte per pàgina 2', async () => {
    await listPublicBlogPosts({ locale: 'ca', page: 2, limit: 10 });

    expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });
});

describe('getPublicBlogPost', () => {
  it('retorna post amb traduccions', async () => {
    const result = await getPublicBlogPost('boda-perfecta', 'ca');

    expect(result).toBeTruthy();
    expect(result!.slug).toBe('boda-perfecta');
  });

  it('retorna null si no existeix', async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue(null);

    const result = await getPublicBlogPost('no-existeix', 'ca');
    expect(result).toBeNull();
  });

  it('retorna null si no té traduccions per locale', async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({
      ...MOCK_POST,
      translations: [],
    });

    const result = await getPublicBlogPost('boda-perfecta', 'en');
    expect(result).toBeNull();
  });
});

describe('incrementPublicBlogPostView', () => {
  it('incrementa viewCount', async () => {
    await incrementPublicBlogPostView('boda-perfecta');

    expect(mockPrisma.blogPost.updateMany).toHaveBeenCalledWith({
      where: { slug: 'boda-perfecta', isPublished: true },
      data: { viewCount: { increment: 1 } },
    });
  });
});
