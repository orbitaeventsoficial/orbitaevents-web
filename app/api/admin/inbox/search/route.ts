/**
 * API: Cerca cross-folder a IMAP
 * ================================
 * GET /api/admin/inbox/search?q=...&folder=...&limit=...
 *   → { ok: true, emails: EmailMessage[], folder, query }
 *
 * Si no s'especifica `folder`, cerca a INBOX. Per cross-folder cal cridar
 * l'endpoint múltiples vegades (client-side) per a cada carpeta visible.
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { searchEmails } from '@/lib/imap';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const folder = (searchParams.get('folder') || 'INBOX').trim();
  const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

  if (!q) {
    return NextResponse.json({ ok: false, error: 'Falta el paràmetre q (cerca)' }, { status: 400 });
  }

  try {
    const emails = await searchEmails({ folder, query: q, limit });
    return NextResponse.json({ ok: true, emails, folder, query: q });
  } catch (error) {
    log.error('[inbox.search] Error', error as Error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error cercant',
    }, { status: 500 });
  }
}
