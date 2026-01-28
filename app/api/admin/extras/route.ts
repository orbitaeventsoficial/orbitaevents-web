// app/api/admin/extras/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EXTRAS, type ExtraDefinition } from '@/config/packs-config';

const SETTING_KEY = 'extras.configurator';

function getDefaultExtras(): ExtraDefinition[] {
  return EXTRAS.map((extra) => ({
    ...extra,
  }));
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) {
    return NextResponse.json({
      ok: true,
      config: getDefaultExtras(),
      isDefault: true,
    });
  }

  try {
    const parsed = JSON.parse(setting.value) as ExtraDefinition[];
    return NextResponse.json({ ok: true, config: parsed, isDefault: false });
  } catch {
    return NextResponse.json({
      ok: true,
      config: getDefaultExtras(),
      isDefault: true,
    });
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const config = body?.config as ExtraDefinition[] | undefined;

  if (!Array.isArray(config)) {
    return NextResponse.json({ ok: false, error: 'Config inválida' }, { status: 400 });
  }

  const sanitized = config.map((extra) => ({
    id: String(extra.id || '').trim(),
    name: String(extra.name || '').trim(),
    description: String(extra.description || '').trim(),
    price: extra.price ?? null,
    consultarPrecio: Boolean(extra.consultarPrecio),
    icon: String(extra.icon || '').trim(),
    category: extra.category || 'other',
    compatibleWith: Array.isArray(extra.compatibleWith) ? extra.compatibleWith : undefined,
    popular: Boolean(extra.popular),
    premium: Boolean(extra.premium),
  })).filter((extra) => extra.id && extra.name);

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(sanitized),
      type: 'JSON',
      category: 'config',
      label: 'Extras configurador',
      description: 'Listado de extras mostrado en el configurador',
    },
    update: {
      value: JSON.stringify(sanitized),
      type: 'JSON',
      category: 'config',
    },
  });

  return NextResponse.json({ ok: true });
}
