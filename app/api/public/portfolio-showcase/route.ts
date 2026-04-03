import { NextResponse } from 'next/server';
import { listPublicPortfolioShowcaseStories } from '@/lib/services/publicPortfolioShowcaseService';

export const revalidate = 3600;

export async function GET() {
  const stories = await listPublicPortfolioShowcaseStories();
  const items = stories.map((story) => ({
    slug: story.slug,
    photos: story.photos,
  }));

  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
  );
}
