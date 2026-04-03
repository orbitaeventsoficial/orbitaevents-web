import { NextResponse } from 'next/server';
import { PUBLIC_HERO_MEDIA_FALLBACK } from '@/lib/constants';
import { getManagedImageCollection } from '@/lib/services/imageManagerService';
import { listActiveHeroMedia } from '@/lib/services/heroVideoService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const managedSlides = await getManagedImageCollection('home.hero.slides');
    if (managedSlides?.length) {
      const media = managedSlides.map((item, index) => ({
        id: item.id || `managed-hero-${index}`,
        url: item.src,
        type: item.mimeType?.startsWith('video/') ? 'video' : 'image',
        label: item.label || item.alt || `Hero ${index + 1}`,
        active: true,
        sortOrder: index,
      }));
      return NextResponse.json(media, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    }

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
