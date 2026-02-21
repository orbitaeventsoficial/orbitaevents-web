import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'packs.includedExtras';

type IncludedExtrasMap = Record<string, string[]>;

function sanitizeMap(input: unknown): IncludedExtrasMap {
  if (!input || typeof input !== 'object') return {};
  const out: IncludedExtrasMap = {};
  for (const [rawSlug, rawIds] of Object.entries(input as Record<string, unknown>)) {
    const slug = String(rawSlug || '').trim();
    if (!slug) continue;
    if (!Array.isArray(rawIds)) continue;
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

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) return NextResponse.json({ ok: true, includedByPack: {} as IncludedExtrasMap });

  try {
    const parsed = JSON.parse(setting.value);
    return NextResponse.json({ ok: true, includedByPack: sanitizeMap(parsed) });
  } catch {
    return NextResponse.json({ ok: true, includedByPack: {} as IncludedExtrasMap });
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  const map = sanitizeMap(body?.includedByPack);

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(map),
      type: 'JSON',
      category: 'config',
      label: 'Extres inclosos per pack',
      description: 'IDs d’extres que ja venen inclosos a cada pack (slug -> extraIds)',
    },
    update: {
      value: JSON.stringify(map),
      type: 'JSON',
      category: 'config',
      label: 'Extres inclosos per pack',
    },
  });

  return NextResponse.json({ ok: true });
}

