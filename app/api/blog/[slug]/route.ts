import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getPublicBlogPost } from '@/lib/services/publicBlogService';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'es';

    const post = await getPublicBlogPost(params.slug, locale);
    if (!post) {
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
