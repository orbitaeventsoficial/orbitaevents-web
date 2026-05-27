/**
 * API: Llista carpetes IMAP amb status (unread + total)
 * ======================================================
 * GET /api/admin/inbox/folders
 *   → { ok: true, folders: FolderInfo[], special: SpecialFolders }
 *
 * Una sola crida IMAP llista totes les carpetes + comptadors + classificació
 * per a sidebar de l'admin (Entrada/Enviats/Esborranys/Paperera/Spam/Arxiu +
 * carpetes custom).
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { discoverSpecialFolders, listFoldersWithStatus } from '@/lib/imap';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const [folders, special] = await Promise.all([
      listFoldersWithStatus(),
      discoverSpecialFolders(),
    ]);
    return NextResponse.json({ ok: true, folders, special });
  } catch (error) {
    log.error('[inbox.folders] Error', error as Error);
    const message = error instanceof Error ? error.message : 'Error obtenint carpetes';
    if (message.includes('IMAP not configured')) {
      return NextResponse.json({ ok: false, error: 'IMAP no configurat' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
