/**
 * POST /api/admin/emails/sent/[id]/append-imap
 * ──────────────────────────────────────────────────────────────────────────
 * Reintent d'APPEND al folder Sent IMAP per a un EmailSend que tingui
 * `imapAppendOk = false | null`. Reconstrueix el MIME a partir del snapshot
 * `htmlBody` + headers Òrbita persistits i el fa append al folder Sent.
 *
 * Cas d'ús: el cas Eric i altres emails que es van enviar abans del canvi
 * #821 (sense traça) o quan l'append va fallar transitòriament.
 *
 * La lògica viu a `lib/services/emailSentRetryService.ts`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { retryAppendToSent } from '@/lib/services/emailSentRetryService';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = await verifyCsrf(request);
  if (csrfError) return csrfError;

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'ID buit' }, { status: 400 });
  }

  try {
    const result = await retryAppendToSent(id);
    switch (result.kind) {
      case 'ok':
        return NextResponse.json({
          ok: true,
          folder: result.folder,
          uid: result.uid,
          alreadyAppended: result.alreadyAppended,
        });
      case 'not-found':
        return NextResponse.json({ error: 'EmailSend no trobat' }, { status: 404 });
      case 'no-snapshot':
        return NextResponse.json({ error: 'No tenim snapshot HTML per reconstruir el MIME' }, { status: 400 });
      case 'no-sent-folder':
        return NextResponse.json({ ok: false, error: 'Servidor IMAP sense carpeta Sent' }, { status: 400 });
      case 'no-smtp-from':
        return NextResponse.json({ ok: false, error: 'SMTP_FROM no configurat' }, { status: 500 });
      case 'append-failed':
        return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    log.error('[emails.sent.append-imap] Error', error as Error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error inesperat' },
      { status: 500 }
    );
  }
}
