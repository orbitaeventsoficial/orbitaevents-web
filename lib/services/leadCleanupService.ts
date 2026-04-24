import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { OPEN_LEAD_STATUSES } from '@/lib/constants';
import { markLeadAsLost } from '@/lib/services/leadLossService';

/**
 * Lead Cleanup Service
 *
 * 1. Auto-LOST: leads amb data d'event passada que encara estan oberts.
 *    Cada lead auto-perdut queda classificat amb lostReason='EVENT_PASSED'
 *    via markLeadAsLost(), de manera que l'audit trail i l'analítica de
 *    pèrdues tenen dades reals sense dependre d'intervenció manual.
 * 2. Auto-DELETE: leads LOST de fa +90 dies sense reserva.
 */

const DAYS_BEFORE_DELETE = 90;
const AUTO_LOST_ACTOR = 'system:lead-cleanup';
const AUTO_LOST_REASON = 'EVENT_PASSED';

export async function runLeadCleanup(): Promise<{
  autoLost: number;
  autoDeleted: number;
}> {
  const now = new Date();

  // 1. Marca com LOST els leads amb data d'event passada, amb motiu canònic
  const openLeadsWithPastEvent = await prisma.lead.findMany({
    where: {
      status: { in: [...OPEN_LEAD_STATUSES] },
      eventDate: { not: null, lt: now },
    },
    select: { id: true },
  });

  let autoLost = 0;
  for (const lead of openLeadsWithPastEvent) {
    const result = await markLeadAsLost({
      leadId: lead.id,
      reason: AUTO_LOST_REASON,
      actor: AUTO_LOST_ACTOR,
      now,
    });
    if (result.ok) {
      autoLost += 1;
    } else {
      log.warn(`Lead cleanup: no s'ha pogut marcar com LOST el lead ${lead.id}: ${result.error}`);
    }
  }

  if (autoLost > 0) {
    log.info(`Lead cleanup: ${autoLost} leads marcats com LOST (data event passada, motiu ${AUTO_LOST_REASON})`);
  }

  // 2. Elimina leads LOST de fa +90 dies (sense reserva)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_BEFORE_DELETE);

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

    await prisma.$transaction(async (tx) => {
      await tx.leadNote.deleteMany({ where: { leadId: { in: ids } } });
      await tx.leadActivity.deleteMany({ where: { leadId: { in: ids } } });
      await tx.task.deleteMany({ where: { leadId: { in: ids } } });
      await tx.leadDocument.deleteMany({ where: { leadId: { in: ids } } });
      const deleted = await tx.lead.deleteMany({ where: { id: { in: ids } } });
      autoDeleted = deleted.count;
    });

    log.info(`Lead cleanup: ${autoDeleted} leads LOST eliminats (>90 dies)`);
  }

  return {
    autoLost,
    autoDeleted,
  };
}
