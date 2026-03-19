import { NextResponse } from 'next/server';
import { listActiveHeroMedia } from '@/lib/services/heroVideoService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const media = await listActiveHeroMedia();
  return NextResponse.json(media, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
