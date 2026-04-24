import { prisma } from '@/lib/prisma';
import {
  LEAD_LOST_REASONS,
  LEAD_LOST_REASON_LABELS,
  isAutoLossReason,
  type LeadLostReason,
} from '@/lib/constants/leadLoss';

export type LossReportLead = {
  id: string;
  name: string;
  lostReason: string | null;
  lostAt: Date | null;
  eventType: string;
  source: string;
  budget: string | null;
  eventLocation: string | null;
};

export type LossBreakdownEntry<TKey extends string = string> = {
  key: TKey;
  label: string;
  count: number;
  share: number;
};

export type MonthlyLossPoint = {
  monthIso: string;
  count: number;
};

export type LossSummary = {
  total: number;
  uncategorized: number;
  autoTotal: number;
  commercialTotal: number;
  byReason: LossBreakdownEntry<LeadLostReason>[];
  byEventType: LossBreakdownEntry[];
  bySource: LossBreakdownEntry[];
  byMonth: MonthlyLossPoint[];
  topReason: { reason: LeadLostReason; label: string; count: number; share: number } | null;
};

function share(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function monthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function humaniseKey(key: string): string {
  if (!key) return 'Desconegut';
  return key
    .toLowerCase()
    .split(/[\s_]+/)
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function computeLossSummary(leads: LossReportLead[]): LossSummary {
  const total = leads.length;
  const reasonCounts = new Map<LeadLostReason, number>();
  const eventTypeCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  let uncategorized = 0;
  let autoTotal = 0;

  for (const lead of leads) {
    const reason = lead.lostReason as LeadLostReason | null;
    if (reason && (LEAD_LOST_REASONS as readonly string[]).includes(reason)) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
      if (isAutoLossReason(reason)) autoTotal += 1;
    } else {
      uncategorized += 1;
    }

    eventTypeCounts.set(lead.eventType, (eventTypeCounts.get(lead.eventType) ?? 0) + 1);
    sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1);

    if (lead.lostAt instanceof Date && !Number.isNaN(lead.lostAt.getTime())) {
      const key = monthKey(lead.lostAt);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
  }

  const commercialTotal = total - autoTotal - uncategorized;

  const byReason: LossBreakdownEntry<LeadLostReason>[] = LEAD_LOST_REASONS
    .map((reason) => ({
      key: reason,
      label: LEAD_LOST_REASON_LABELS[reason],
      count: reasonCounts.get(reason) ?? 0,
      share: share(reasonCounts.get(reason) ?? 0, total),
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const byEventType: LossBreakdownEntry[] = Array.from(eventTypeCounts.entries())
    .map(([key, count]) => ({
      key,
      label: humaniseKey(key),
      count,
      share: share(count, total),
    }))
    .sort((a, b) => b.count - a.count);

  const bySource: LossBreakdownEntry[] = Array.from(sourceCounts.entries())
    .map(([key, count]) => ({
      key,
      label: humaniseKey(key),
      count,
      share: share(count, total),
    }))
    .sort((a, b) => b.count - a.count);

  const byMonth: MonthlyLossPoint[] = Array.from(monthCounts.entries())
    .map(([monthIso, count]) => ({ monthIso, count }))
    .sort((a, b) => a.monthIso.localeCompare(b.monthIso));

  const topCommercial = byReason.find((entry) => !isAutoLossReason(entry.key));
  const topReason = topCommercial
    ? {
        reason: topCommercial.key,
        label: topCommercial.label,
        count: topCommercial.count,
        share: topCommercial.share,
      }
    : null;

  return {
    total,
    uncategorized,
    autoTotal,
    commercialTotal,
    byReason,
    byEventType,
    bySource,
    byMonth,
    topReason,
  };
}

export type LoadLossReportInput = {
  sinceDays?: number;
  now?: Date;
};

export async function loadLossReport(input: LoadLossReportInput = {}): Promise<LossSummary> {
  const now = input.now ?? new Date();
  const sinceDays = input.sinceDays ?? 90;
  const since = new Date(now.getTime() - sinceDays * 24 * 60 * 60 * 1000);

  const leads = await prisma.lead.findMany({
    where: {
      status: 'LOST',
      OR: [
        { lostAt: { gte: since } },
        { lostAt: null, updatedAt: { gte: since } },
      ],
    },
    select: {
      id: true,
      name: true,
      lostReason: true,
      lostAt: true,
      eventType: true,
      source: true,
      budget: true,
      eventLocation: true,
    },
  });

  return computeLossSummary(leads as LossReportLead[]);
}
