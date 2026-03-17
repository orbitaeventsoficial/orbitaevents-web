import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'packs.includedExtras';

export type IncludedExtrasMap = Record<string, string[]>;

export function sanitizeIncludedExtrasMap(input: unknown): IncludedExtrasMap {
  if (!input || typeof input !== 'object') return {};

  const out: IncludedExtrasMap = {};
  for (const [rawSlug, rawIds] of Object.entries(input as Record<string, unknown>)) {
    const slug = String(rawSlug || '').trim();
    if (!slug || !Array.isArray(rawIds)) continue;

    const ids = Array.from(
      new Set(
        rawIds
          .map((id) => String(id || '').trim())
          .filter(Boolean)
      )
    );

    out[slug] = ids;
  }

  return out;
}

export async function getIncludedExtrasMap(): Promise<IncludedExtrasMap> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting?.value) return {};

  try {
    return sanitizeIncludedExtrasMap(JSON.parse(setting.value));
  } catch {
    return {};
  }
}

export async function saveIncludedExtrasMap(input: unknown): Promise<IncludedExtrasMap> {
  const includedByPack = sanitizeIncludedExtrasMap(input);

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(includedByPack),
      type: 'JSON',
      category: 'config',
      label: 'Extres inclosos per pack',
      description: 'IDs d’extres que ja venen inclosos a cada pack (slug -> extraIds)',
    },
    update: {
      value: JSON.stringify(includedByPack),
      type: 'JSON',
      category: 'config',
      label: 'Extres inclosos per pack',
    },
  });

  return includedByPack;
}