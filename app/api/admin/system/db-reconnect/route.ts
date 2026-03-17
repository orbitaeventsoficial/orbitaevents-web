import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { reconnectDatabase } from '@/lib/services/dbReconnectService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    return NextResponse.json(await reconnectDatabase());
  } catch (error) {
    log.error('Error reconnecting database', error);
    return NextResponse.json(
      { ok: false, error: 'No s’ha pogut reiniciar la connexio de base de dades' },
      { status: 500 }
    );
  }
}
