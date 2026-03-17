import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runCommercialSequences } from '@/lib/services/commercialSequenceService';
import { enforceLeadSla } from '@/lib/services/slaAutomationService';

export async function readCommercialSequenceMetrics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [commSent, commResponded, sequenceExec] = await Promise.all([
    prisma.adminLog.count({ where: { action: 'COMM_SENT', createdAt: { gte: since } } }),
    prisma.adminLog.count({ where: { action: 'COMM_RESPONDED', createdAt: { gte: since } } }),
    prisma.adminLog.count({ where: { action: 'COMM_SEQUENCE_EXEC', createdAt: { gte: since } } }),
  ]);

  return {
    commSent,
    commResponded,
    responseRate: commSent > 0 ? commResponded / commSent : 0,
    sequenceExec,
  };
}

export async function runCommercialSequencesAutomation() {
  const summary = await runCommercialSequences();
  await prisma.adminLog.create({
    data: {
      action: 'COMM_SEQUENCE_BATCH',
      entity: 'automation',
      entityId: 'commercial-sequences',
      details: summary as unknown as Prisma.InputJsonValue,
    },
  });
  return summary;
}

export async function enforceSlaAutomation() {
  const summary = await enforceLeadSla();
  await prisma.adminLog.create({
    data: {
      action: 'AUTOMATION_SLA_ENFORCED',
      entity: 'lead',
      entityId: 'bulk',
      details: summary as unknown as Prisma.InputJsonValue,
    },
  });
  return summary;
}

export async function runAllAdminAutomations() {
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
      details: summary as unknown as Prisma.InputJsonValue,
    },
  });

  return summary;
}