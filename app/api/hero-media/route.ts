import { NextResponse } from 'next/server';
import { PUBLIC_HERO_MEDIA_FALLBACK } from '@/lib/constants';
import { listActiveHeroMedia } from '@/lib/services/heroVideoService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const media = await listActiveHeroMedia();
    return NextResponse.json(media, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json(PUBLIC_HERO_MEDIA_FALLBACK, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  }
}
