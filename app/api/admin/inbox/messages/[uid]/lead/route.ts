import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { importLeadFromInboxMessage } from '@/lib/services/inboxLeadImportService';

interface RouteParams {
  params: Promise<{ uid: string }>;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const { uid } = await params;
  const uidNum = Number.parseInt(uid, 10);

  try {
    const payload = await request.json().catch(() => ({}));
    const result = await importLeadFromInboxMessage(uidNum, payload?.fallbackEmail || {});
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant lead des d’email', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error creant lead des d’email' },
      { status: 500 }
    );
  }
}
