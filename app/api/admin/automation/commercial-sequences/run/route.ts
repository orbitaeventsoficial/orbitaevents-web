import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { readCommercialSequenceMetrics, runCommercialSequencesAutomation } from '@/lib/services/adminAutomationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);

  try {
    const metrics30d = await readCommercialSequenceMetrics();
    return NextResponse.json({ ok: true, metrics30d });
  } catch (error) {
    log.error('Error reading sequence metrics', error, {
      context: { requestId, endpoint: 'admin/automation/commercial-sequences/run:GET' },
    });
    return NextResponse.json({ ok: false, error: 'No s’han pogut llegir les mètriques' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);

  try {
    const summary = await runCommercialSequencesAutomation();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('Error running commercial sequences', error, {
      context: { requestId, endpoint: 'admin/automation/commercial-sequences/run:POST' },
    });
    return NextResponse.json(
      { ok: false, error: 'No s’han pogut executar les seqüències comercials' },
      { status: 500 }
    );
  }
}