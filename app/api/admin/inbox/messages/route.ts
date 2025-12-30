/**
 * API: Obtenir emails reals del servidor IMAP
 * ===========================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInboxEmails } from '@/lib/services/imapService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const result = await getInboxEmails(limit, offset);

    return NextResponse.json({
      ok: true,
      emails: result.emails,
      total: result.total,
    });

  } catch (error) {
    console.error('Error IMAP:', error);

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
