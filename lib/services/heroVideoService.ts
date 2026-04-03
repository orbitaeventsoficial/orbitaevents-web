/**
 * Hero Media Service
 * Gestiona els mitjans rotatius del hero (imatges + vídeos) des de l'admin.
 * Emmagatzema la configuració a Setting (key: config.heroMedia, type: JSON).
 */

import { HERO_MEDIA_DEFAULT_ITEMS } from '@/lib/constants/hero-media';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile, getPublicUrl, fileExists } from '@/lib/storage';

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

// ── Write ─────────────────────────────────────────────────────────────────

async function saveHeroMedia(media: HeroMedia[]): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(media) },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(media),
      type: 'JSON',
      category: 'config',
      label: 'Hero Media',
      description: 'Mitjans rotatius del hero (imatges + vídeos)',
    },
  });
}

// ── Add media (upload or URL) ─────────────────────────────────────────────

export async function addHeroMedia(input: {
  file?: { buffer: Buffer; originalName: string };
  externalUrl?: string;
  label: string;
  mediaType?: HeroMediaType;
}): Promise<HeroMedia> {
  const media = await listHeroMedia();

  let url: string;
  let detectedType: HeroMediaType = input.mediaType || 'image';

  if (input.file) {
    const ext = input.file.originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
    detectedType = isVideo ? 'video' : 'image';
    const filename = `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `hero/${filename}`;
    await uploadFile(filePath, input.file.buffer);
    url = getPublicUrl(filePath);
  } else if (input.externalUrl) {
    url = input.externalUrl;
    const lower = url.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) {
      detectedType = 'video';
    }
  } else {
    throw new Error('Cal un fitxer o una URL');
  }

  const newMedia: HeroMedia = {
    id: `hero-${Date.now()}`,
    url,
    type: detectedType,
    label: input.label || (detectedType === 'video' ? 'Vídeo' : 'Imatge'),
    active: true,
    sortOrder: media.length,
  };

  media.push(newMedia);
  await saveHeroMedia(media);
  return newMedia;
}

// ── Remove ────────────────────────────────────────────────────────────────

export async function removeHeroMedia(mediaId: string): Promise<void> {
  const media = await listHeroMedia();
  const item = media.find((m) => m.id === mediaId);
  if (!item) return;

  // Eliminar fitxer si és upload local
  if (item.url.startsWith('/api/uploads/hero/')) {
    const filePath = item.url.replace('/api/uploads/', '');
    try {
      if (await fileExists(filePath)) {
        await deleteFile(filePath);
      }
    } catch { /* ignore */ }
  }

  const remaining = media
    .filter((m) => m.id !== mediaId)
    .map((m, i) => ({ ...m, sortOrder: i }));

  await saveHeroMedia(remaining);
}

// ── Toggle active ─────────────────────────────────────────────────────────

export async function toggleHeroMedia(mediaId: string): Promise<void> {
  const media = await listHeroMedia();
  const item = media.find((m) => m.id === mediaId);
  if (!item) return;

  item.active = !item.active;
  await saveHeroMedia(media);
}

// ── Reorder ───────────────────────────────────────────────────────────────

export async function reorderHeroMedia(orderedIds: string[]): Promise<void> {
  const media = await listHeroMedia();
  const reordered = orderedIds
    .map((id, i) => {
      const m = media.find((m) => m.id === id);
      return m ? { ...m, sortOrder: i } : null;
    })
    .filter(Boolean) as HeroMedia[];

  const missing = media.filter((m) => !orderedIds.includes(m.id));
  missing.forEach((m, i) => { m.sortOrder = reordered.length + i; });

  await saveHeroMedia([...reordered, ...missing]);
}

// ── Update label ──────────────────────────────────────────────────────────

export async function updateHeroMediaLabel(mediaId: string, label: string): Promise<void> {
  const media = await listHeroMedia();
  const item = media.find((m) => m.id === mediaId);
  if (!item) return;

  item.label = label;
  await saveHeroMedia(media);
}

