import { prisma } from '@/lib/prisma';

export async function reconnectDatabase() {
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

  return {
    ok: true,
    message: 'Connexio amb la base de dades reiniciada',
    at: new Date().toISOString(),
  };
}
