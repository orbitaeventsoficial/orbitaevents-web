import type { PUBLIC_HERO_MEDIA_FALLBACK } from '@/lib/constants';

export type HeroMediaItem = (typeof PUBLIC_HERO_MEDIA_FALLBACK)[number];

export async function fetchHeroMedia(init?: RequestInit): Promise<HeroMediaItem[]> {
  const response = await fetch('/api/hero-media', init);
  if (!response.ok) {
    throw new Error(`hero-media fetch failed (${response.status})`);
  }
  return (await response.json()) as HeroMediaItem[];
}
