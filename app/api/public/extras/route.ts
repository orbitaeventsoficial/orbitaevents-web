import { NextResponse } from 'next/server';
import { EXTRAS, type ExtraDefinition } from '@/config/packs-config';

const SETTING_KEY = 'extras.configurator';

export const dynamic = 'force-dynamic';

function getDefaultExtras(): ExtraDefinition[] {
  return EXTRAS.map((extra) => ({ ...extra }));
}

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });

    if (!setting) {
      return NextResponse.json({ ok: true, extras: getDefaultExtras(), isDefault: true });
    }

    try {
      const parsed = JSON.parse(setting.value) as ExtraDefinition[];
      return NextResponse.json({ ok: true, extras: parsed, isDefault: false });
    } catch {
      return NextResponse.json({ ok: true, extras: getDefaultExtras(), isDefault: true });
    }
  } catch {
    return NextResponse.json({ ok: true, extras: getDefaultExtras(), isDefault: true });
  }
}
