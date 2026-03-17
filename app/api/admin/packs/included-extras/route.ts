import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getIncludedExtrasMap,
  saveIncludedExtrasMap,
} from '@/lib/services/includedExtrasService';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const includedByPack = await getIncludedExtrasMap();
  return NextResponse.json({ ok: true, includedByPack });
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json().catch(() => ({}));
  await saveIncludedExtrasMap(body?.includedByPack);

  return NextResponse.json({ ok: true });
}