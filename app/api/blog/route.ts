import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { listPublicBlogPosts } from '@/lib/services/publicBlogService';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'es';
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const result = await listPublicBlogPosts({ locale, page, limit, category, tag });
    return NextResponse.json(result);
  } catch (error) {
    log.error('Failed to fetch blog posts', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
