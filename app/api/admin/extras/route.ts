// app/api/admin/extras/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getExtrasConfiguratorConfig,
  saveExtrasConfiguratorConfig,
} from '@/lib/services/extrasConfiguratorService';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { config, isDefault } = await getExtrasConfiguratorConfig();
  return NextResponse.json({ ok: true, config, isDefault });
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const config = body?.config;

  if (!Array.isArray(config)) {
    return NextResponse.json({ ok: false, error: 'Config inválida' }, { status: 400 });
  }

  await saveExtrasConfiguratorConfig(config);
  return NextResponse.json({ ok: true });
}