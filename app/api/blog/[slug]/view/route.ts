// app/api/blog/[slug]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { incrementPublicBlogPostView } from '@/lib/services/publicBlogService';
import { log } from '@/lib/logger';

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    await incrementPublicBlogPostView(slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('[Blog] Error incrementant views:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
