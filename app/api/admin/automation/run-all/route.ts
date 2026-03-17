import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { runAllAdminAutomations } from '@/lib/services/adminAutomationService';

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
    const summary = await runAllAdminAutomations();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('Error running all automations', error, {
      context: { requestId, endpoint: 'admin/automation/run-all:POST' },
    });
    return NextResponse.json({ ok: false, error: 'No s’han pogut executar les automatitzacions' }, { status: 500 });
  }
}