/**
 * API: Sincronitzar Packs del Config a la Base de Dades
 * POST /api/admin/packs/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { syncAdminPacksFromConfig } from '@/lib/services/packAdminService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    return NextResponse.json(await syncAdminPacksFromConfig());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error sincronitzant packs';
    log.error('Error en sincronització de packs:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
