import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { handleInboxImapSettings, readInboxImapSettings } from '@/lib/services/imapSettingsService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { config, connection } = await readInboxImapSettings();

  return NextResponse.json({
    ok: true,
    config,
    connection,
  });
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
