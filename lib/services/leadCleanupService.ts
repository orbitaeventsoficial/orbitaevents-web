import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

/**
 * Lead Cleanup Service
 *
 * 1. Auto-LOST: leads amb data d'event passada que encara estan oberts
 * 2. Auto-DELETE: leads LOST de fa +90 dies sense reserva
 */

const OPEN_STATUSES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] as const;
const DAYS_BEFORE_DELETE = 90;

export async function runLeadCleanup(): Promise<{
  autoLost: number;
  autoDeleted: number;
}> {
  const now = new Date();

  // 1. Marca com LOST els leads amb data d'event passada
  const autoLostResult = await prisma.lead.updateMany({
    where: {
      status: { in: [...OPEN_STATUSES] },
      eventDate: { not: null, lt: now },
    },
    data: {
      status: 'LOST',
    },
  });

  if (autoLostResult.count > 0) {
    log.info(`Lead cleanup: ${autoLostResult.count} leads marcats com LOST (data event passada)`);
  }

  // 2. Elimina leads LOST de fa +90 dies (sense reserva)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_BEFORE_DELETE);

  // Primer troba els leads que es poden eliminar
  const leadsToDelete = await prisma.lead.findMany({
    where: {
      status: 'LOST',
      updatedAt: { lt: cutoffDate },
      booking: null,
    },
    select: { id: true },
  });

  let autoDeleted = 0;

  if (leadsToDelete.length > 0) {
    const ids = leadsToDelete.map((l) => l.id);

    // Elimina en transaction (cascade manual)
    await prisma.$transaction(async (tx) => {
      await tx.leadNote.deleteMany({ where: { leadId: { in: ids } } });
      await tx.leadActivity.deleteMany({ where: { leadId: { in: ids } } });
      await tx.task.deleteMany({ where: { leadId: { in: ids } } });
      await tx.leadTask.deleteMany({ where: { leadId: { in: ids } } });
      await tx.leadDocument.deleteMany({ where: { leadId: { in: ids } } });
      const deleted = await tx.lead.deleteMany({ where: { id: { in: ids } } });
      autoDeleted = deleted.count;
    });

    log.info(`Lead cleanup: ${autoDeleted} leads LOST eliminats (>90 dies)`);
  }

  return {
    autoLost: autoLostResult.count,
    autoDeleted,
  };
}
