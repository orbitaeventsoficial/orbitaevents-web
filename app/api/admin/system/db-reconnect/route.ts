import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    await prisma.$disconnect();
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'system',
        entityId: 'database.connection',
        details: { action: 'db_reconnect' },
      },
    }).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      message: 'Connexio amb la base de dades reiniciada',
      at: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Error reconnecting database', error);
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut reiniciar la connexio de base de dades' },
      { status: 500 }
    );
  }
}
