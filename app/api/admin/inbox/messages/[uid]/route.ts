/**
 * API: Obtenir email individual i accions
 * =======================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { deleteEmail, fetchEmailByUid, markAsRead, markAsUnread } from '@/lib/imap';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ uid: string }>;
}

// GET - Obtenir email per UID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const { uid } = await params;
  const uidNumber = parseInt(uid);

  if (isNaN(uidNumber)) {
    return NextResponse.json({ error: 'UID invàlid' }, { status: 400 });
  }

  try {
    const email = await fetchEmailByUid(uidNumber);

    if (!email) {
      return NextResponse.json({ error: 'Email no trobat' }, { status: 404 });
    }

    // Marcar automàticament com llegit
    await markAsRead(uidNumber);

    return NextResponse.json({ ok: true, email });

  } catch (error) {
    log.error('Error obtenint email:', error);
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
  const uidNumber = parseInt(uid);

  if (isNaN(uidNumber)) {
    return NextResponse.json({ error: 'UID invàlid' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'markRead') {
      const success = await markAsRead(uidNumber);
      return NextResponse.json({ ok: success });
    }

    if (action === 'markUnread') {
      const success = await markAsUnread(uidNumber);
      return NextResponse.json({ ok: success });
    }

    return NextResponse.json({ error: 'Acció no reconeguda' }, { status: 400 });

  } catch (error) {
    log.error('Error processant acció:', error);
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
  const uidNumber = parseInt(uid);

  if (isNaN(uidNumber)) {
    return NextResponse.json({ error: 'UID invàlid' }, { status: 400 });
  }

  try {
    const success = await deleteEmail(uidNumber);
    if (!success) {
      return NextResponse.json({ ok: false, error: 'No s\'ha pogut eliminar' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant email:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error eliminant email',
    }, { status: 500 });
  }
}
