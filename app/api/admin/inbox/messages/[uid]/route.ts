/**
 * API: Obtenir email individual i accions (IMAP)
 * ================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { deleteEmail, fetchEmailByUid, getTrashFolderPath, markAsRead, markAsUnread, moveToFolder, restoreFromTrash } from '@/lib/imap';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ uid: string }>;
}

// GET - Obtenir email per ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const { uid } = await params;

  if (!uid) {
    return NextResponse.json({ error: 'ID invàlid' }, { status: 400 });
  }

  try {
    const uidNum = Number.parseInt(uid, 10);
    if (!Number.isFinite(uidNum)) {
      return NextResponse.json({ error: 'ID invàlid' }, { status: 400 });
    }

    const email = await fetchEmailByUid(uidNum);

    if (!email) {
      return NextResponse.json({ error: 'Email no trobat' }, { status: 404 });
    }

    // Marcar automàticament com llegit
    await markAsRead(uidNum);

    // Convertir al format esperat
    const formattedEmail = {
      id: email.id,
      uid: email.uid,
      messageId: email.messageId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      date: email.date,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml,
      isRead: true, // Acabem de marcar-lo com llegit
      hasAttachments: email.hasAttachments,
      attachments: [],
    };

    return NextResponse.json({ ok: true, email: formattedEmail });

  } catch (error) {
    log.error('Error obtenint email:', error as Error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error obtenint email',
    }, { status: 500 });
  }
}

// PATCH - Accions sobre l'email (marcar llegit/no llegit)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const { uid } = await params;

  if (!uid) {
    return NextResponse.json({ error: 'ID invàlid' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const uidNum = Number.parseInt(uid, 10);

    if (!Number.isFinite(uidNum)) {
      return NextResponse.json({ error: 'ID invàlid' }, { status: 400 });
    }

    if (action === 'markRead') {
      const success = await markAsRead(uidNum);
      return NextResponse.json({ ok: success });
    }

    if (action === 'markUnread') {
      const success = await markAsUnread(uidNum);
      return NextResponse.json({ ok: success });
    }

    if (action === 'moveToTrash') {
      const sourceFolder = body.folder || 'INBOX';
      const trashPath = await getTrashFolderPath();
      if (!trashPath) {
        return NextResponse.json({ ok: false, error: 'No s\'ha trobat la carpeta paperera al servidor' }, { status: 500 });
      }
      const success = await moveToFolder(uidNum, trashPath, sourceFolder);
      return NextResponse.json({ ok: success });
    }

    if (action === 'restore') {
      const success = await restoreFromTrash(uidNum);
      return NextResponse.json({ ok: success });
    }

    return NextResponse.json({ error: 'Acció no reconeguda' }, { status: 400 });

  } catch (error) {
    log.error('Error processant acció:', error as Error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error processant acció',
    }, { status: 500 });
  }
}

// DELETE - Eliminar email
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const { uid } = await params;

  if (!uid) {
    return NextResponse.json({ error: 'ID invàlid' }, { status: 400 });
  }

  try {
    const uidNum = Number.parseInt(uid, 10);
    if (!Number.isFinite(uidNum)) {
      return NextResponse.json({ error: 'ID invàlid' }, { status: 400 });
    }

    const success = await deleteEmail(uidNum);
    if (!success) {
      return NextResponse.json({ ok: false, error: 'No s\'ha pogut eliminar' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant email:', error as Error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error eliminant email',
    }, { status: 500 });
  }
}
