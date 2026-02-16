import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET no configurat' }, { status: 500 });
  }

  try {
    const response = await fetch(`${req.nextUrl.origin}/api/cron/commercial-daily`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error || 'No s’ha pogut executar el resum diari' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, summary: data.summary });
  } catch (error) {
    log.error('Error triggering commercial-daily from admin', error, {
      context: { requestId, endpoint: 'admin/automation/daily-summary/run:POST' },
    });
    return NextResponse.json(
      { ok: false, error: 'No s’ha pogut llançar el resum diari' },
      { status: 500 }
    );
  }
}
