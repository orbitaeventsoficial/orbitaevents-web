import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    blogPost: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    blogPostTranslation: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  deleteAdminBlogPost,
} from '@/lib/services/blogAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.blogPost.findUnique.mockResolvedValue(null);
  mockPrisma.blogPost.findMany.mockResolvedValue([]);
  mockPrisma.blogPost.count.mockResolvedValue(0);
  mockPrisma.blogPost.create.mockResolvedValue({ id: 'bp1', slug: 'test' });
  mockPrisma.blogPost.delete.mockResolvedValue({});
  mockPrisma.blogPost.update.mockResolvedValue({});
  mockPrisma.blogPostTranslation.deleteMany.mockResolvedValue({});
  mockPrisma.blogPostTranslation.createMany.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation((fn: Function) => {
    const tx = {
      blogPost: {
        update: mockPrisma.blogPost.update,
        findUnique: mockPrisma.blogPost.findUnique,
      },
      blogPostTranslation: {
        deleteMany: mockPrisma.blogPostTranslation.deleteMany,
        createMany: mockPrisma.blogPostTranslation.createMany,
      },
    };
    return fn(tx);
  });
});

describe('listAdminBlogPosts', () => {
  it('retorna post per id', async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({ id: 'bp1', slug: 'test', translations: [] });

    const result = await listAdminBlogPosts({ id: 'bp1', locale: 'ca', page: 1, limit: 20 });

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty('post');
  });

  it('retorna 404 si post no existeix', async () => {
    const result = await listAdminBlogPosts({ id: 'inexistent', locale: 'ca', page: 1, limit: 20 });

    expect(result.status).toBe(404);
  });

  it('retorna llista paginada', async () => {
    mockPrisma.blogPost.findMany.mockResolvedValue([]);
    mockPrisma.blogPost.count.mockResolvedValue(25);

    const result = await listAdminBlogPosts({ locale: 'ca', page: 2, limit: 10 });

    expect(result.status).toBe(200);
    expect(result.body.pagination!.total).toBe(25);
    expect(result.body.pagination!.totalPages).toBe(3);
  });

  it('filtra per categoria i published', async () => {
    await listAdminBlogPosts({ locale: 'ca', page: 1, limit: 20, category: 'events', published: 'true' });

    expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'events', isPublished: true }),
      })
    );
  });
});

describe('createAdminBlogPost', () => {
  it('retorna 400 sense slug', async () => {
    const result = await createAdminBlogPost({ translations: [{ locale: 'ca', title: 'T', content: 'C' }] });

    expect(result.status).toBe(400);
  });

  it('retorna 400 sense translations', async () => {
    const result = await createAdminBlogPost({ slug: 'test' });

    expect(result.status).toBe(400);
  });

  it('retorna 409 si slug duplicat', async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await createAdminBlogPost({
      slug: 'duplicat',
      translations: [{ locale: 'ca', title: 'T', content: 'C' }],
    });

    expect(result.status).toBe(409);
  });

  it('crea post amb translations', async () => {
    const result = await createAdminBlogPost({
      slug: 'nou-post',
      translations: [{ locale: 'ca', title: 'Nou', content: 'Contingut' }],
    });

    expect(result.status).toBe(201);
    expect(mockPrisma.blogPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'nou-post',
          author: 'Òrbita Events',
          category: 'general',
        }),
      })
    );
  });
});

describe('updateAdminBlogPost', () => {
  it('retorna 400 sense id', async () => {
    const result = await updateAdminBlogPost({});

    expect(result.status).toBe(400);
  });

  it('retorna 404 si no existeix', async () => {
    const result = await updateAdminBlogPost({ id: 'inexistent' });

    expect(result.status).toBe(404);
  });

  it('actualitza post amb transaction', async () => {
    mockPrisma.blogPost.findUnique
      .mockResolvedValueOnce({ id: 'bp1', isPublished: false, translations: [] })
      .mockResolvedValueOnce({ id: 'bp1', slug: 'updated' });

    const result = await updateAdminBlogPost({
      id: 'bp1',
      slug: 'updated',
      translations: [{ locale: 'ca', title: 'Updated', content: 'New' }],
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.blogPost.update).toHaveBeenCalled();
    expect(mockPrisma.blogPostTranslation.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.blogPostTranslation.createMany).toHaveBeenCalled();
  });
});

describe('deleteAdminBlogPost', () => {
  it('retorna 400 sense id', async () => {
    const result = await deleteAdminBlogPost();

    expect(result.status).toBe(400);
  });

  it('retorna 404 si no existeix', async () => {
    const result = await deleteAdminBlogPost('inexistent');

    expect(result.status).toBe(404);
  });

  it('elimina post', async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValue({ id: 'bp1' });

    const result = await deleteAdminBlogPost('bp1');

    expect(result.status).toBe(200);
    expect(mockPrisma.blogPost.delete).toHaveBeenCalledWith({ where: { id: 'bp1' } });
  });
});
