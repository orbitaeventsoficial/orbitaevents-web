import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { runCommercialSequences } from '@/lib/services/commercialSequenceService';
import { enforceLeadSla } from '@/lib/services/slaAutomationService';
import { prisma } from '@/lib/prisma';
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

  try {
    const [sequences, sla] = await Promise.all([
      runCommercialSequences(),
      enforceLeadSla(),
    ]);

    const summary = {
      generatedAt: new Date().toISOString(),
      sequences,
      sla,
    };

    await prisma.adminLog.create({
      data: {
        action: 'AUTOMATION_RUN_ALL',
        entity: 'automation',
        entityId: 'run-all',
        details: JSON.parse(JSON.stringify(summary)),
      },
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('Error running all automations', error, {
      context: { requestId, endpoint: 'admin/automation/run-all:POST' },
    });
    return NextResponse.json({ ok: false, error: 'No se pudo ejecutar automatizaciones' }, { status: 500 });
  }
}
