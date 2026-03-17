/**
 * API: Obtenir emails via IMAP
 * ==================================
 * Compatible amb entorns serverless
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import {
  fetchEmails,
  countUnread,
  countTotal,
  testConnection,
} from '@/lib/imap';
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

    // Comptar total (per paperera o altres carpetes)
    if (action === 'countTotal') {
      const total = await countTotal(folder);
      return NextResponse.json({ total });
    }

    // Obtenir emails
    const emails = await fetchEmails({
      folder,
      limit,
      offset,
      onlyUnread,
    });

    const totalCount = emails.length;
    const unreadCount = emails.filter((email) => !email.isRead).length;

    // Convertir format Gmail a format esperat pel frontend
    const formattedEmails = emails.map(email => ({
      id: email.id,
      uid: email.uid,
      messageId: email.messageId,
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
      folder,
    });

  } catch (error) {
    log.error('Error IMAP:', error as Error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconegut';

    if (errorMessage.includes('IMAP not configured')) {
      return NextResponse.json({
        ok: false,
        error: 'IMAP no configurat. Cal definir les variables IMAP.',
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: 'Error obtenint emails',
      details: errorMessage,
    }, { status: 500 });
  }
}

