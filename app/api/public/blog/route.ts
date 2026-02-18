// app/api/public/blog/route.ts
// API pública per al blog - llista posts publicats

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'es';
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
  const category = searchParams.get('category') || undefined;
  const slug = searchParams.get('slug') || undefined;

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;
  const skip = (page - 1) * limit;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, posts: [], pagination: { page, limit, total: 0, totalPages: 0 } });
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    // Single post by slug
    if (slug) {
      const post = await cachedQuery(
        `public:blog:slug:${slug}:${locale}`,
        () => prisma.blogPost.findUnique({
          where: { slug, isPublished: true },
          include: {
            translations: {
              where: { locale },
            },
          },
        }),
        CacheTTL.LONG
      );

      if (!post || post.translations.length === 0) {
        return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      }

      return NextResponse.json({ ok: true, post }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
      });
    }

    // List posts
    const where = {
      isPublished: true,
      ...(category ? { category } : {}),
    };

    const cacheKey = `public:blog:list:${locale}:${page}:${limit}:${category || 'all'}`;

    const result = await cachedQuery(
      cacheKey,
      async () => {
        const [posts, total] = await Promise.all([
          prisma.blogPost.findMany({
            where,
            include: {
              translations: {
                where: { locale },
                select: { title: true, excerpt: true, metaTitle: true, metaDescription: true },
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

    return NextResponse.json({
      ok: true,
      posts: result.posts,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });

  } catch (error) {
    log.error('Error fetching public blog posts', error);
    return NextResponse.json({ ok: true, posts: [], pagination: { page, limit, total: 0, totalPages: 0 } });
  }
}
