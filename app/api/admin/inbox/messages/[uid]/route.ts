/**
 * API: Obtenir email individual i accions (Gmail)
 * ================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { deleteEmail, fetchEmailById, markAsRead, markAsUnread } from '@/lib/gmail';
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
    const email = await fetchEmailById(uid);

    if (!email) {
      return NextResponse.json({ error: 'Email no trobat' }, { status: 404 });
    }

    // Marcar automàticament com llegit
    await markAsRead(uid);

    // Convertir al format esperat
    const formattedEmail = {
      id: email.id,
      uid: email.id,
      messageId: email.id,
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

    if (action === 'markRead') {
      const success = await markAsRead(uid);
      return NextResponse.json({ ok: success });
    }

    if (action === 'markUnread') {
      const success = await markAsUnread(uid);
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
    const success = await deleteEmail(uid);
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
