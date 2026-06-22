import { NextRequest, NextResponse } from 'next/server';
import { SettingType } from '@prisma/client';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { createAdminSetting, listAdminSettings, updateAdminSettings } from '@/lib/services/adminSettingsService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const result = await listAdminSettings(category);

    return NextResponse.json({
      ok: true,
      settings: result.settings,
      raw: result.raw,
    });
  } catch (error) {
    log.error('Error obtenint settings:', error);
    return NextResponse.json(
      { error: 'Error obtenint configuracions' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { settings } = body as { settings: { key: string; value: string | number | boolean | object }[] };

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Format invàlid' },
        { status: 400 }
      );
    }

    const updated = await updateAdminSettings(settings);

    return NextResponse.json({
      ok: true,
      updated,
    });
  } catch (error) {
    log.error('Error actualitzant settings:', error);
    return NextResponse.json(
      { error: 'Error actualitzant configuracions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { key, value, type, category, label, description } = body as {
      key?: string;
      value?: string | number | boolean | object;
      type?: SettingType;
      category?: string;
      label?: string;
      description?: string;
    };

    if (!key || !category) {
      return NextResponse.json(
        { error: 'key i category són obligatoris' },
        { status: 400 }
      );
    }

    const setting = await createAdminSetting({
      key,
      value: value ?? '',
      type,
      category,
      label,
      description,
    });

    return NextResponse.json({
      ok: true,
      setting,
    });
  } catch (error) {
    log.error('Error creant setting:', error);
    return NextResponse.json(
      { error: 'Error creant configuració' },
      { status: 500 }
    );
  }
}

