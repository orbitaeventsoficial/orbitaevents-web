/**
 * API: Desar esborrany al folder Drafts IMAP
 * ============================================
 * POST /api/admin/inbox/drafts
 * Body:
 *   { to: string; subject?: string; bodyHtml?: string; bodyText?: string;
 *     cc?: string; bcc?: string; orbita?: { kind, id, origin } }
 *   → { ok: true }
 *
 * Construeix el MIME via MailComposer i fa APPEND al folder Drafts. Si no hi
 * ha folder Drafts descobert, retorna 400.
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import {
  appendToFolder,
  buildOrbitaHeaders,
  buildOrbitaMessageId,
  discoverSpecialFolders,
  type OrbitaContext,
} from '@/lib/imap';
import { buildMime } from '@/lib/mailComposerLoader';

export const dynamic = 'force-dynamic';

interface DraftPayload {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  orbita?: Partial<OrbitaContext>;
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const csrfError = await verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = (await request.json()) as DraftPayload;
    const to = (body.to || '').trim();
    const subject = (body.subject || '').trim() || '(Sense assumpte)';
    const html = (body.bodyHtml || '').trim();
    const text = (body.bodyText || '').trim();
    const cc = (body.cc || '').trim();
    const bcc = (body.bcc || '').trim();

    const special = await discoverSpecialFolders();
    if (!special.drafts) {
      return NextResponse.json(
        { ok: false, error: 'El servidor IMAP no té carpeta Drafts/Esborranys' },
        { status: 400 }
      );
    }

    const fromAddress = (process.env.SMTP_FROM || '').trim();
    if (!fromAddress) {
      return NextResponse.json({ ok: false, error: 'SMTP_FROM no configurat' }, { status: 500 });
    }

    const orbitaCtx: OrbitaContext | undefined = body.orbita && body.orbita.kind
      ? {
          kind: body.orbita.kind,
          id: body.orbita.id,
          origin: body.orbita.origin || 'draft',
        }
      : undefined;
    const orbitaHeaders = orbitaCtx ? buildOrbitaHeaders(orbitaCtx) : undefined;
    const messageId = orbitaCtx ? buildOrbitaMessageId(orbitaCtx) : undefined;

    const built = await buildMime({
      from: `"Orbita Events" <${fromAddress}>`,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html: html || undefined,
      text: text || undefined,
      headers: orbitaHeaders,
      messageId,
    });

    const result = await appendToFolder(special.drafts, built, ['\\Draft']);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || 'No s\'ha pogut desar l\'esborrany' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, folder: result.folder, uid: result.uid });
  } catch (error) {
    log.error('[inbox.drafts] Error', error as Error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error desant esborrany' },
      { status: 500 }
    );
  }
}
