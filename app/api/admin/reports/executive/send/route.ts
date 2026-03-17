import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { sendExecutiveReport } from '@/lib/services/executiveReportDispatchService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await sendExecutiveReport();
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error sending executive report', error);
    return NextResponse.json({ ok: false, error: 'Error enviant informe executiu' }, { status: 500 });
  }
}