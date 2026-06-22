import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { isAdminFeatureKey, listAdminFeatures, updateAdminFeature } from '@/lib/services/adminFeaturesService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const features = await listAdminFeatures();
    return NextResponse.json({ ok: true, features });
  } catch (error) {
    log.error('Error obtenint funcionalitats:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obtenint funcionalitats' },
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
    const { key, enabled } = body as { key?: string; enabled?: boolean };

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'Key i enabled són obligatoris' },
        { status: 400 }
      );
    }

    if (!isAdminFeatureKey(key)) {
      return NextResponse.json(
        { ok: false, error: 'Funcionalitat no vàlida' },
        { status: 400 }
      );
    }

    await updateAdminFeature({ key, enabled });

    return NextResponse.json({
      ok: true,
      message: 'Funcionalitat actualitzada correctament',
    });
  } catch (error) {
    log.error('Error actualitzant funcionalitat:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualitzant funcionalitat' },
      { status: 500 }
    );
  }
}
