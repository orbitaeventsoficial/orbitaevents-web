import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { runCommercialDailyAutomation } from '@/lib/services/commercialDailyAutomationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const summary = await runCommercialDailyAutomation();
    return NextResponse.json({ ok: true, summary });
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