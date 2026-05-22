import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runCommercialSequences } from '@/lib/services/commercialSequenceService';
import { enforceLeadSla } from '@/lib/services/slaAutomationService';
import {
  fetchRecentCanonicalCommunicationMetrics,
  fetchRecentCommercialSequenceMetrics,
} from '@/lib/services/timelineQueryService';

function normalizeAdminLogDetails(details: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue;
}

export async function readCommercialSequenceMetrics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [commMetrics, sequenceExec] = await Promise.all([
    fetchRecentCanonicalCommunicationMetrics(since),
    fetchRecentCommercialSequenceMetrics(since),
  ]);

  return {
    commSent: commMetrics.commSent,
    commResponded: commMetrics.commResponded,
    responseRate: commMetrics.responseRate,
    sequenceExec: sequenceExec.sequenceExec,
  };
}

export async function runCommercialSequencesAutomation() {
  const summary = await runCommercialSequences();
  await prisma.adminLog.create({
    data: {
      action: 'COMM_SEQUENCE_BATCH',
      entity: 'automation',
      entityId: 'commercial-sequences',
      details: normalizeAdminLogDetails(summary),
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
      details: normalizeAdminLogDetails(summary),
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
      details: normalizeAdminLogDetails(summary),
    },
  });

  return summary;
}
