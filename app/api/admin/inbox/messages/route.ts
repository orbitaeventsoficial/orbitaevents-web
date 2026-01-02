/**
 * API: Obtenir emails reals del servidor IMAP
 * ===========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { fetchEmails, countUnread, testConnection } from '@/lib/imap';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const folder = searchParams.get('folder') || 'INBOX';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const onlyUnread = searchParams.get('unread') === 'true';

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

    const unreadCount = await countUnread(folder);

    return NextResponse.json({
      ok: true,
      emails,
      total: emails.length,
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
