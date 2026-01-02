/**
 * API: Obtenir email individual i accions
 * =======================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchEmailByUid, markAsRead, markAsUnread } from '@/lib/imap';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ uid: string }>;
}

// GET - Obtenir email per UID
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    console.error('Error obtenint email:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error obtenint email',
    }, { status: 500 });
  }
}

// PATCH - Accions sobre l'email (marcar llegit/no llegit)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    console.error('Error processant acció:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error processant acció',
    }, { status: 500 });
  }
}
