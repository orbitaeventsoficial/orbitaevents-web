import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import {
  getCalendarFeedToken,
  regenerateCalendarFeedToken,
} from '@/lib/services/calendarFeedTokenService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const token = await getCalendarFeedToken();
    return NextResponse.json({ ok: true, token });
  } catch (error) {
    log.error('Error llegint token de calendari', error, {
      context: { requestId, endpoint: 'admin/integrations/calendar-token:GET' },
    });
    return NextResponse.json({ ok: false, error: 'Error llegint token' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'integrations');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const token = await regenerateCalendarFeedToken();
    return NextResponse.json({ ok: true, token });
  } catch (error) {
    log.error('Error regenerant token de calendari', error, {
      context: { requestId, endpoint: 'admin/integrations/calendar-token:POST' },
    });
    return NextResponse.json({ ok: false, error: 'Error regenerant token' }, { status: 500 });
  }
}