import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { runCommercialSequences } from '@/lib/services/commercialSequenceService';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const commSent = await prisma.adminLog.count({
      where: {
        action: 'COMM_SENT',
        createdAt: { gte: since },
      },
    });
    const commResponded = await prisma.adminLog.count({
      where: {
        action: 'COMM_RESPONDED',
        createdAt: { gte: since },
      },
    });
    const sequenceExec = await prisma.adminLog.count({
      where: {
        action: 'COMM_SEQUENCE_EXEC',
        createdAt: { gte: since },
      },
    });

    return NextResponse.json({
      ok: true,
      metrics30d: {
        commSent,
        commResponded,
        responseRate: commSent > 0 ? commResponded / commSent : 0,
        sequenceExec,
      },
    });
  } catch (error) {
    log.error('Error reading sequence metrics', error);
    return NextResponse.json({ ok: false, error: 'No se pudo leer métricas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;

  try {
    const summary = await runCommercialSequences();
    await prisma.adminLog.create({
      data: {
        action: 'COMM_SEQUENCE_BATCH',
        entity: 'automation',
        entityId: 'commercial-sequences',
        details: summary,
      },
    });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('Error running commercial sequences', error);
    return NextResponse.json(
      { ok: false, error: 'No se pudo ejecutar secuencias comerciales' },
      { status: 500 }
    );
  }
}
