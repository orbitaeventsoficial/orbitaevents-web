// app/api/admin/inbox/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getInboxEmails, getEmailByUid, markAsRead, deleteEmail } from '@/lib/services/imapService';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtenir emails de la safata d'entrada
 * Query params: limit, offset
 */
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const uid = searchParams.get('uid');

    // Si es demana un email específic
    if (uid) {
      const email = await getEmailByUid(parseInt(uid));
      if (!email) {
        return NextResponse.json({ error: 'Email no trobat' }, { status: 404 });
      }
      return NextResponse.json(email);
    }

    // Obtenir llista d'emails
    const result = await getInboxEmails(limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint emails:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error obtenint emails' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Marcar email com a llegit
 */
export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { uid, action } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID requerit' }, { status: 400 });
    }

    if (action === 'markAsRead') {
      await markAsRead(uid);
      return NextResponse.json({ ok: true, message: 'Email marcat com a llegit' });
    }

    return NextResponse.json({ error: 'Acció no reconeguda' }, { status: 400 });
  } catch (error) {
    log.error('Error actualitzant email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error actualitzant email' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar email
 */
export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID requerit' }, { status: 400 });
    }

    await deleteEmail(uid);
    return NextResponse.json({ ok: true, message: 'Email eliminat' });
  } catch (error) {
    log.error('Error eliminant email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error eliminant email' },
      { status: 500 }
    );
  }
}