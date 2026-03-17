import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type PublicBlogListInput = {
  locale: string;
  page: number;
  limit: number;
  category?: string | null;
  tag?: string | null;
};

export async function listPublicBlogPosts(input: PublicBlogListInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Prisma.BlogPostWhereInput = {
    isPublished: true,
    translations: { some: { locale: input.locale } },
  };

  if (input.category) where.category = input.category;
  if (input.tag) where.tags = { has: input.tag };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        translations: {
          where: { locale: input.locale },
        },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: input.limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getPublicBlogPost(slug: string, locale: string) {
  const post = await prisma.blogPost.findUnique({
    where: {
      slug,
      isPublished: true,
    },
    include: {
      translations: {
        where: { locale },
      },
    },
  });

  if (!post || post.translations.length === 0) {
    return null;
  }

  return post;
}

export async function incrementPublicBlogPostView(slug: string) {
  await prisma.blogPost.updateMany({
    where: { slug, isPublished: true },
    data: { viewCount: { increment: 1 } },
  });
}
