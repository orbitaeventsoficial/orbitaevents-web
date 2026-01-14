/**
 * API: Obtenir emails reals del servidor IMAP
 * ===========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { fetchEmails, countTotal, countUnread, testConnection } from '@/lib/imap';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const folder = searchParams.get('folder') || 'INBOX';
  const limitRaw = parseInt(searchParams.get('limit') || '50');
  const offsetRaw = parseInt(searchParams.get('offset') || '0');
  const onlyUnread = searchParams.get('unread') === 'true';
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

  if (limitRaw <= 0 || offsetRaw < 0 || Number.isNaN(limitRaw) || Number.isNaN(offsetRaw)) {
    return NextResponse.json(
      { ok: false, error: 'Paràmetres de paginació invàlids' },
      { status: 400 }
    );
  }

  try {
    // Test connexió
    if (action === 'test') {
      const result = await testConnection();
      return NextResponse.json(result);
    }

    // Comptar no llegits
    if (action === 'count') {
      const count = await countUnread(folder);
      return NextResponse.json({ unread: count });
    }

    // Obtenir emails
    const emails = await fetchEmails({
      folder,
      limit,
      offset,
      onlyUnread,
    });

    const [unreadCount, totalCount] = await Promise.all([
      countUnread(folder),
      countTotal(folder),
    ]);

    return NextResponse.json({
      ok: true,
      emails,
      total: totalCount,
      unread: unreadCount,
      folder,
    });

  } catch (error) {
    log.error('Error IMAP:', error);
    
    // Si és error de connexió, donar missatge clar
    const errorMessage = error instanceof Error ? error.message : 'Error desconegut';
    
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json({
        ok: false,
        error: 'No es pot connectar al servidor de correu. Verifica la configuració IMAP.',
        details: errorMessage,
      }, { status: 503 });
    }

    if (errorMessage.includes('AUTHENTICATIONFAILED') || errorMessage.includes('Invalid credentials')) {
      return NextResponse.json({
        ok: false,
        error: 'Credencials incorrectes. Verifica usuari i contrasenya IMAP.',
        details: errorMessage,
      }, { status: 401 });
    }

    return NextResponse.json({
      ok: false,
      error: 'Error obtenint emails',
      details: errorMessage,
    }, { status: 500 });
  }
}
