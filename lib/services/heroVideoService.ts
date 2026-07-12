/**
 * Hero Media Service
 * Gestiona els mitjans rotatius del hero (imatges + vídeos) des de l'admin.
 * Emmagatzema la configuració a Setting (key: config.heroMedia, type: JSON).
 */

import { HERO_MEDIA_DEFAULT_ITEMS } from '@/lib/constants/hero-media';
import { prisma } from '@/lib/prisma';

export type HeroMediaType = 'video' | 'image';

export interface HeroMedia {
  id: string;
  url: string;
  type: HeroMediaType;
  label: string;
  active: boolean;
  sortOrder: number;
}

const SETTING_KEY = 'config.heroMedia';

// ── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_MEDIA: HeroMedia[] = HERO_MEDIA_DEFAULT_ITEMS.map((item, index) => ({
  ...item,
  active: true,
  sortOrder: index,
}));

// ── Read ──────────────────────────────────────────────────────────────────

export async function listHeroMedia(): Promise<HeroMedia[]> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) return DEFAULT_MEDIA;

  try {
    const media = JSON.parse(setting.value) as HeroMedia[];
    return media.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return DEFAULT_MEDIA;
  }
}

export async function listActiveHeroMedia(): Promise<HeroMedia[]> {
  const all = await listHeroMedia();
  return all.filter((m) => m.active);
}
