import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type BlogTranslationInput = {
  locale: string;
  title: string;
  excerpt?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
};

type BlogCreateInput = {
  slug?: string;
  author?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  isPublished?: boolean;
  publishedAt?: string | Date | null;
  readingTime?: number;
  translations?: BlogTranslationInput[];
};

type BlogUpdateInput = BlogCreateInput & {
  id?: string;
};

export async function listAdminBlogPosts(input: {
  id?: string | null;
  locale: string;
  page: number;
  limit: number;
  category?: string | null;
  published?: string | null;
}) {
  if (input.id) {
    const post = await prisma.blogPost.findUnique({
      where: { id: input.id },
      include: { translations: true },
    });

    if (!post) {
      return { status: 404, body: { error: 'Blog post not found' } };
    }

    return { status: 200, body: { post } };
  }

  const where: Prisma.BlogPostWhereInput = {};
  if (input.category) where.category = input.category;
  if (input.published !== null && input.published !== undefined) {
    where.isPublished = input.published === 'true';
  }

  const skip = (input.page - 1) * input.limit;
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        translations: { where: { locale: input.locale } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: input.limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    status: 200,
    body: {
      posts,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    },
  };
}

export async function createAdminBlogPost(input: BlogCreateInput) {
  const { slug, author, category, tags, featuredImage, isPublished, publishedAt, readingTime, translations } = input;

  if (!slug || !translations || translations.length === 0) {
    return { status: 400, body: { error: 'Missing required fields: slug, translations' } };
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    return { status: 409, body: { error: 'A post with this slug already exists' } };
  }

  const post = await prisma.blogPost.create({
    data: {
      slug,
      author: author || 'Òrbita Events',
      category: category || 'general',
      tags: tags || [],
      featuredImage,
      isPublished: isPublished || false,
      publishedAt: isPublished && !publishedAt ? new Date() : publishedAt || null,
      readingTime,
      translations: {
        create: translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title,
          excerpt: translation.excerpt ?? '',
          content: translation.content,
          metaTitle: translation.metaTitle ?? '',
          metaDescription: translation.metaDescription ?? '',
        })),
      },
    },
    include: { translations: true },
  });

  return { status: 201, body: post };
}

export async function updateAdminBlogPost(input: BlogUpdateInput) {
  const { id, slug, author, category, tags, featuredImage, isPublished, publishedAt, readingTime, translations } = input;

  if (!id) {
    return { status: 400, body: { error: 'Missing required field: id' } };
  }

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!existing) {
    return { status: 404, body: { error: 'Blog post not found' } };
  }

  const updatedPost = await prisma.$transaction(async (tx) => {
    await tx.blogPost.update({
      where: { id },
      data: {
        slug,
        author,
        category,
        tags,
        featuredImage,
        isPublished,
        publishedAt: isPublished && !existing.isPublished && !publishedAt ? new Date() : publishedAt,
        readingTime,
      },
    });

    if (translations && translations.length > 0) {
      await tx.blogPostTranslation.deleteMany({ where: { postId: id } });
      await tx.blogPostTranslation.createMany({
        data: translations.map((translation) => ({
          postId: id,
          locale: translation.locale,
          title: translation.title,
          excerpt: translation.excerpt ?? '',
          content: translation.content,
          metaTitle: translation.metaTitle ?? '',
          metaDescription: translation.metaDescription ?? '',
        })),
      });
    }

    return tx.blogPost.findUnique({
      where: { id },
      include: { translations: true },
    });
  });

  return { status: 200, body: updatedPost };
}

export async function deleteAdminBlogPost(id?: string | null) {
  if (!id) {
    return { status: 400, body: { error: 'Missing required parameter: id' } };
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return { status: 404, body: { error: 'Blog post not found' } };
  }

  await prisma.blogPost.delete({ where: { id } });
  return { status: 200, body: { success: true } };
}

