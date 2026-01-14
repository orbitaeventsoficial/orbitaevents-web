import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

/**
 * GET /api/blog
 * List published blog posts (public)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'es';
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 50)
      : 10;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const skip = (page - 1) * limit;

    // Build where clause - only published posts with a translation for locale
    const where: Prisma.BlogPostWhereInput = {
      isPublished: true,
      translations: { some: { locale } },
    };

    if (category) where.category = category;
    if (tag) where.tags = { has: tag };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: {
            where: { locale },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

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
    console.error('Failed to fetch blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
