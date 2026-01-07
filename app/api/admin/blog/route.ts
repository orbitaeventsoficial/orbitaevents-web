import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logInfo, logError } from '@/lib/logger';

/**
 * GET /api/admin/blog
 * List all blog posts (admin)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'es';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category');
    const published = searchParams.get('published');

    const skip = (page - 1) * limit;

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

    logInfo('Blog posts listed', { count: posts.length, total, page, limit });

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
    logError('Failed to list blog posts', error);
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

    logInfo('Blog post created', { postId: post.id, slug: post.slug });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logError('Failed to create blog post', error);
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

    // Update post
    const post = await prisma.blogPost.update({
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
      include: {
        translations: true,
      },
    });

    // Update translations if provided
    if (translations && translations.length > 0) {
      // Delete existing translations
      await prisma.blogPostTranslation.deleteMany({
        where: { postId: id },
      });

      // Create new translations
      await prisma.blogPostTranslation.createMany({
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

    // Fetch updated post with translations
    const updatedPost = await prisma.blogPost.findUnique({
      where: { id },
      include: { translations: true },
    });

    logInfo('Blog post updated', { postId: id, slug: post.slug });

    return NextResponse.json(updatedPost);
  } catch (error) {
    logError('Failed to update blog post', error);
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

    logInfo('Blog post deleted', { postId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Failed to delete blog post', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
