import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import {
  getPackPricingModelConfigEditable,
  upsertPackPricingModelConfig,
} from '@/lib/services/packPricingHealth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const config = await getPackPricingModelConfigEditable();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json().catch(() => ({}));
    const saved = await upsertPackPricingModelConfig(body?.config || {}, getAdminRole(req));
    return NextResponse.json({ ok: true, config: saved });
  } catch (error) {
    log.error('Error updating pack pricing model config', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut actualitzar la configuració econòmica dels packs' },
      { status: 500 }
    );
  }
}
