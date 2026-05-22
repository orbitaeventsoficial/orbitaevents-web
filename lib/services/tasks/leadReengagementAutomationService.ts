import { prisma } from '@/lib/prisma';
import { OPEN_TASK_STATUSES, TASK_DEDUPE_KEY } from '@/lib/constants';
import {
  loadReengagementCandidates,
  type ReengagementCandidate,
  type ReengagementPriority,
} from '@/lib/services/leadReengagementService';

export type LeadReengagementAutomationResult = {
  candidates: number;
  proposed: number;
  created: number;
  skipped: number;
};

const PRIORITY_MAP: Record<ReengagementPriority, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
  ALTA: 'HIGH',
  MITJANA: 'MEDIUM',
  BAIXA: 'LOW',
};

function buildTitle(candidate: ReengagementCandidate): string {
  return `Reengagement: ${candidate.name} (${candidate.reasonLabel})`;
}

function buildDescription(candidate: ReengagementCandidate): string {
  const parts: string[] = [];
  parts.push(`Motiu: ${candidate.reasonLabel}.`);
  if (candidate.daysSinceActivity != null) {
    parts.push(`Última activitat fa ${candidate.daysSinceActivity} dies.`);
  }
  if (candidate.daysUntilEvent != null && candidate.daysUntilEvent > 0) {
    parts.push(`Event en ${candidate.daysUntilEvent} dies.`);
  }
  parts.push(
    `Canals suggerits: ${candidate.suggestedChannels.length > 0 ? candidate.suggestedChannels.join(' + ') : 'cap'}.`,
  );
  parts.push('Veure suggeriment complet a /admin/leads/reengagement.');
  return parts.join(' ');
}

function dueDateFor(now: Date, priority: ReengagementPriority): Date {
  if (priority === 'ALTA') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }
  if (priority === 'MITJANA') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0, 0, 0);
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 18, 0, 0, 0);
}

export type LeadReengagementProposal = {
  leadId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: Date;
  dedupeKey: string;
};

export function buildLeadReengagementProposals(
  candidates: ReengagementCandidate[],
  now: Date,
  options: { includeLow?: boolean } = {},
): LeadReengagementProposal[] {
  const includeLow = options.includeLow ?? false;
  return candidates
    .filter((c) => includeLow || c.reengagementPriority !== 'BAIXA')
    .map((c) => ({
      leadId: c.leadId,
      title: buildTitle(c),
      description: buildDescription(c),
      priority: PRIORITY_MAP[c.reengagementPriority],
      dueDate: dueDateFor(now, c.reengagementPriority),
      dedupeKey: TASK_DEDUPE_KEY.reengagement(c.leadId),
    }));
}

export async function runLeadReengagementAutomation(
  now: Date = new Date(),
  options: { limit?: number; includeLow?: boolean } = {},
): Promise<LeadReengagementAutomationResult> {
  const limit = options.limit ?? 50;
  const candidates = await loadReengagementCandidates(now, limit);
  const proposals = buildLeadReengagementProposals(candidates, now, {
    includeLow: options.includeLow,
  });

  if (proposals.length === 0) {
    return { candidates: candidates.length, proposed: 0, created: 0, skipped: 0 };
  }

  const existing = await prisma.task.findMany({
    where: {
      source: 'AUTOMATION',
      status: { in: [...OPEN_TASK_STATUSES] },
      dedupeKey: { in: proposals.map((p) => p.dedupeKey) },
    },
    select: { dedupeKey: true },
  });
  const existingKeys = new Set(
    existing.map((t) => t.dedupeKey).filter((k): k is string => Boolean(k)),
  );

  const toCreate = proposals.filter((p) => !existingKeys.has(p.dedupeKey));
  const skipped = proposals.length - toCreate.length;

  if (toCreate.length > 0) {
    await prisma.task.createMany({
      data: toCreate.map((p) => ({
        title: p.title,
        description: p.description,
        priority: p.priority,
        dueDate: p.dueDate,
        leadId: p.leadId,
        status: 'OPEN',
        createdBy: 'system:auto',
        source: 'AUTOMATION',
        autoRule: 'LEAD_REENGAGEMENT',
        dedupeKey: p.dedupeKey,
      })),
      skipDuplicates: true,
    });
  }

  return {
    candidates: candidates.length,
    proposed: proposals.length,
    created: toCreate.length,
    skipped,
  };
}
