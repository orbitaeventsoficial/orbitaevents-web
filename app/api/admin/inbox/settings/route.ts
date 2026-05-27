import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { deleteImapSettings, handleInboxImapSettings, readInboxImapSettings } from '@/lib/services/imapSettingsService';
import { getEmailSignatureSetting, saveEmailSignatureSetting } from '@/lib/services/safataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const [{ config, connection }, signature] = await Promise.all([
    readInboxImapSettings(),
    getEmailSignatureSetting(),
  ]);

  return NextResponse.json({ ok: true, config, connection, signature });
}

export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json() as { signature?: string };
    const value = typeof body.signature === 'string' ? body.signature.trim() : '';
    await saveEmailSignatureSetting(value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desant la firma' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    await deleteImapSettings();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error eliminant configuració IMAP' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await handleInboxImapSettings(body as {
      host: string;
      port?: string | number | null;
      user: string;
      pass: string;
      testOnly?: boolean;
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error guardant configuracio IMAP' },
      { status: 400 }
    );
  }
}
