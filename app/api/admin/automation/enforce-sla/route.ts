import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { enforceLeadSla, getSlaSnapshot } from '@/lib/services/slaAutomationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const snapshot = await getSlaSnapshot();

  return NextResponse.json({
    ok: true,
    ...snapshot,
  });
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const summary = await enforceLeadSla();

    await prisma.adminLog.create({
      data: {
        action: 'AUTOMATION_SLA_ENFORCED',
        entity: 'lead',
        entityId: 'bulk',
        details: JSON.parse(JSON.stringify(summary)),
      },
    });

    return NextResponse.json({
      ok: true,
      ...summary,
    });
  } catch (error) {
    log.error('Error enforcing SLA automation', error);
    return NextResponse.json(
      { ok: false, error: 'Error ejecutando automatización SLA' },
      { status: 500 }
    );
  }
}
