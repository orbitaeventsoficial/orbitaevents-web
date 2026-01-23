import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

/**
 * GET /api/blog/[slug]
 * Get a single published blog post by slug
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'es';

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
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    log.error('Failed to fetch blog post', error, { context: { slug: params.slug } });
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
