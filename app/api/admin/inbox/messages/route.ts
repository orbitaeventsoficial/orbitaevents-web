/**
 * API: Obtenir emails via Gmail API
 * ==================================
 * Compatible amb Vercel Serverless
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import {
  fetchEmails,
  countTotal,
  countUnread,
  testConnection,
  isGmailConfigured,
} from '@/lib/gmail';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const limitRaw = parseInt(searchParams.get('limit') || '50');
  const query = searchParams.get('q') || '';
  const onlyUnread = searchParams.get('unread') === 'true';
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

  try {
    // Test connexió
    if (action === 'test') {
      const result = await testConnection();
      return NextResponse.json(result);
    }

    // Verificar si Gmail està configurat
    const configured = await isGmailConfigured();
    if (!configured) {
      return NextResponse.json({
        ok: false,
        error: 'Gmail no configurat. Cal autoritzar el compte de Gmail.',
        needsAuth: true,
      }, { status: 401 });
    }

    // Comptar no llegits
    if (action === 'count') {
      const count = await countUnread();
      return NextResponse.json({ unread: count });
    }

    // Obtenir emails
    const labelIds = onlyUnread ? ['INBOX', 'UNREAD'] : ['INBOX'];
    const emails = await fetchEmails({
      maxResults: limit,
      query,
      labelIds,
    });

    const [unreadCount, totalCount] = await Promise.all([
      countUnread(),
      countTotal(),
    ]);

    // Convertir format Gmail a format esperat pel frontend
    const formattedEmails = emails.map(email => ({
      id: email.id,
      uid: email.id, // Gmail usa IDs de string, no UIDs numèrics
      messageId: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      date: email.date,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml,
      isRead: email.isRead,
      hasAttachments: email.hasAttachments,
      attachments: [],
    }));

    return NextResponse.json({
      ok: true,
      emails: formattedEmails,
      total: totalCount,
      unread: unreadCount,
      folder: 'INBOX',
    });

  } catch (error) {
    log.error('Error Gmail:', error as Error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconegut';

    if (errorMessage.includes('No Gmail access token') || errorMessage.includes('No Gmail autoritzat')) {
      return NextResponse.json({
        ok: false,
        error: 'Cal autoritzar el compte de Gmail.',
        needsAuth: true,
      }, { status: 401 });
    }

    return NextResponse.json({
      ok: false,
      error: 'Error obtenint emails',
      details: errorMessage,
    }, { status: 500 });
  }
}
