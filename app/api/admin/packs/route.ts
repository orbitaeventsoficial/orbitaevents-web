// app/api/admin/packs/route.ts
// API per gestionar packs
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { createAdminPack, listAdminPacks } from '@/lib/services/packAdminService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'ca';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const result = await listAdminPacks(locale, includeInactive);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint packs:', error);
    return NextResponse.json(
      { error: 'Error obtenint packs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const result = await createAdminPack(body ?? {});
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant pack:', error);
    return NextResponse.json(
      { error: 'Error creant pack' },
      { status: 500 }
    );
  }
}
