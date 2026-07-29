/**
 * API: Sincronitzar Packs del Config a la Base de Dades
 * POST /api/admin/packs/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { syncAdminPacksFromConfig } from '@/lib/services/packAdminService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    return NextResponse.json(await syncAdminPacksFromConfig());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error sincronitzant packs';
    log.error('Error en sincronització de packs:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
