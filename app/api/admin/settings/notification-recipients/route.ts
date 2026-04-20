import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import {
  listNotificationRecipients,
  saveNotificationRecipients,
  NOTIFICATION_CATEGORIES,
} from '@/lib/services/notificationRecipientsService';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const recipients = await listNotificationRecipients();
    return NextResponse.json({ ok: true, recipients, categories: NOTIFICATION_CATEGORIES });
  } catch (error) {
    log.error('Error loading notification recipients', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut carregar la llista de destinataris' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body?.recipients) ? body.recipients : [];
    const saved = await saveNotificationRecipients(incoming);
    return NextResponse.json({ ok: true, recipients: saved });
  } catch (error) {
    log.error('Error saving notification recipients', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'han pogut desar els destinataris' },
      { status: 500 }
    );
  }
}
