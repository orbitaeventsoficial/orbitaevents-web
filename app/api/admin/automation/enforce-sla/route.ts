import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getSlaSnapshot } from '@/lib/services/slaAutomationService';
import { enforceSlaAutomation } from '@/lib/services/adminAutomationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const snapshot = await getSlaSnapshot();
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    log.error('Error reading SLA snapshot', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut llegir l\'estat SLA' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const summary = await enforceSlaAutomation();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    log.error('Error enforcing SLA automation', error);
    return NextResponse.json(
      { ok: false, error: 'Error ejecutando automatización SLA' },
      { status: 500 }
    );
  }
}