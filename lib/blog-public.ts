import 'server-only';

import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { prisma } from '@/lib/prisma';

export interface PublicBlogTranslation {
  title: string;
  excerpt: string;
  content?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface PublicBlogPost {
  id: string;
  slug: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  readingTime: number | null;
  translations: PublicBlogTranslation[];
}

export interface PublicBlogListResult {
  posts: PublicBlogPost[];
  total: number;
}

export async function getPublicBlogPost(slug: string, locale: string): Promise<PublicBlogPost | null> {
  return cachedQuery(
    `public:blog:slug:${slug}:${locale}`,
    () => prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
      include: {
        translations: {
          where: { locale },
          select: {
            title: true,
            excerpt: true,
            content: true,
            metaTitle: true,
            metaDescription: true,
          },
        },
      },
    }),
    CacheTTL.LONG
  );
}

export async function getPublicBlogPosts(
  locale: string,
  page: number,
  limit: number,
  category?: string
): Promise<PublicBlogListResult> {
  const skip = (page - 1) * limit;
  const where = {
    isPublished: true,
    ...(category ? { category } : {}),
  };

  return cachedQuery(
    `public:blog:list:${locale}:${page}:${limit}:${category || 'all'}`,
    async () => {
      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: {
            translations: {
              where: { locale },
              select: {
                title: true,
                excerpt: true,
                content: true,
                metaTitle: true,
                metaDescription: true,
              },
            },
          },
          orderBy: { publishedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.blogPost.count({ where }),
      ]);

      return { posts, total };
    },
    CacheTTL.LONG
  );
}
