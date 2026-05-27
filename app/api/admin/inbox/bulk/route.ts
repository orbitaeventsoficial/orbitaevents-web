/**
 * API: Accions en lot sobre múltiples emails IMAP
 * =================================================
 * POST /api/admin/inbox/bulk
 * Body:
 *   { uids: number[]; folder: string;
 *     action: 'markRead' | 'markUnread' | 'flag' | 'unflag' | 'moveTo' | 'delete';
 *     targetFolder?: string }
 *   → { ok: true, affected: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { bulkAction } from '@/lib/imap';

export const dynamic = 'force-dynamic';

const ALLOWED_ACTIONS = new Set(['markRead', 'markUnread', 'flag', 'unflag', 'moveTo', 'delete']);

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const csrfError = await verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json() as {
      uids?: unknown;
      folder?: unknown;
      action?: unknown;
      targetFolder?: unknown;
    };

    const uidsRaw = Array.isArray(body.uids) ? body.uids : [];
    const uids = uidsRaw
      .map(u => Number(u))
      .filter(u => Number.isFinite(u) && u > 0);
    const folder = typeof body.folder === 'string' ? body.folder : 'INBOX';
    const action = typeof body.action === 'string' ? body.action : '';
    const targetFolder = typeof body.targetFolder === 'string' ? body.targetFolder : undefined;

    if (uids.length === 0) {
      return NextResponse.json({ ok: false, error: 'Cap UID vàlid' }, { status: 400 });
    }
    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ ok: false, error: `Acció no suportada: ${action}` }, { status: 400 });
    }

    const result = await bulkAction({
      uids,
      folder,
      action: action as Parameters<typeof bulkAction>[0]['action'],
      targetFolder,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    log.error('[inbox.bulk] Error', error as Error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error processant acció en lot',
    }, { status: 500 });
  }
}
