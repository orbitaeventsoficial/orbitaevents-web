import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/admin/blog
 * List all blog posts (admin)
 */
export async function GET(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale') || 'es';
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 100)
      : 20;
    const category = searchParams.get('category');
    const published = searchParams.get('published');

    const skip = (page - 1) * limit;

    if (id) {
      const post = await prisma.blogPost.findUnique({
        where: { id },
        include: { translations: true },
      });

      if (!post) {
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
      }

      return NextResponse.json({ post });
    }

    // Build where clause
    const where: Prisma.BlogPostWhereInput = {};
    if (category) where.category = category;
    if (published !== null && published !== undefined) {
      where.isPublished = published === 'true';
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: {
            where: { locale },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    log.info('Blog posts listed', { count: posts.length, total, page, limit });

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    log.error('Failed to list blog posts', error);
    return NextResponse.json(
      { error: 'Failed to list blog posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blog
 * Create a new blog post
 */
export async function POST(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const {
      slug,
      author,
      category,
      tags,
      featuredImage,
      isPublished,
      publishedAt,
      readingTime,
      translations,
    } = body;

    // Validate required fields
    if (!slug || !translations || translations.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, translations' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Create post with translations
    const post = await prisma.blogPost.create({
      data: {
        slug,
        author: author || 'Òrbita Events',
        category: category || 'general',
        tags: tags || [],
        featuredImage,
        isPublished: isPublished || false,
        publishedAt: isPublished && !publishedAt ? new Date() : publishedAt,
        readingTime,
        translations: {
          create: translations.map((t: any) => ({
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt,
            content: t.content,
            metaTitle: t.metaTitle,
            metaDescription: t.metaDescription,
          })),
        },
      },
      include: {
        translations: true,
      },
    });

    log.info('Blog post created', { postId: post.id, slug: post.slug });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    log.error('Failed to create blog post', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/blog
 * Update an existing blog post
 */
export async function PUT(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const {
      id,
      slug,
      author,
      category,
      tags,
      featuredImage,
      isPublished,
      publishedAt,
      readingTime,
      translations,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Check if post exists
    const existing = await prisma.blogPost.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      const post = await tx.blogPost.update({
        where: { id },
        data: {
          slug,
          author,
          category,
          tags,
          featuredImage,
          isPublished,
          publishedAt:
            isPublished && !existing.isPublished && !publishedAt
              ? new Date()
              : publishedAt,
          readingTime,
        },
      });

      if (translations && translations.length > 0) {
        await tx.blogPostTranslation.deleteMany({
          where: { postId: id },
        });

        await tx.blogPostTranslation.createMany({
          data: translations.map((t: any) => ({
            postId: id,
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt,
            content: t.content,
            metaTitle: t.metaTitle,
            metaDescription: t.metaDescription,
          })),
        });
      }

      const postWithTranslations = await tx.blogPost.findUnique({
        where: { id },
        include: { translations: true },
      });

      return postWithTranslations;
    });

    log.info('Blog post updated', { postId: id, slug: updatedPost?.slug });

    return NextResponse.json(updatedPost);
  } catch (error) {
    log.error('Failed to update blog post', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/blog
 * Delete a blog post
 */
export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Check if post exists
    const existing = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Delete post (cascade will delete translations)
    await prisma.blogPost.delete({
      where: { id },
    });

    log.info('Blog post deleted', { postId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Failed to delete blog post', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
