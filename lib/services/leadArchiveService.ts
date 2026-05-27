import { prisma } from '@/lib/prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArchiveFilters {
  lostReason?: string | null;
  eventType?: string | null;
  source?: string | null;
  from?: Date | null; // archivedAt >= from
  to?: Date | null;   // archivedAt <  to
  search?: string | null; // name/email ILIKE
}

export interface ArchivePagination {
  limit: number;  // page size
  offset: number; // skip
}

export interface ArchiveRecord {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  eventDate: Date | null;
  eventLocation: string | null;
  guestCount: number | null;
  source: string;
  estimatedValue: number | null;
  priority: string;
  assignedTo: string | null;
  lostReason: string | null;
  lostAt: Date | null;
  originalCreatedAt: Date;
  originalUpdatedAt: Date;
  contactedAt: Date | null;
  archivedAt: Date;
  archivedBy: string | null;
}

export interface ArchiveListResult {
  records: ArchiveRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReasonStat {
  reason: string; // canonical key or 'UNCLASSIFIED'
  count: number;
  percentage: number; // 0-100, 1 decimal
  totalValue: number; // sum of estimatedValue per motiu
}

export interface MonthlyStat {
  monthKey: string; // 'YYYY-MM'
  lost: number;
  won: number;
  lostValue: number;
}

export interface BreakdownStat {
  key: string;
  count: number;
  totalValue: number;
}

export interface ArchiveStats {
  totalLost: number;
  totalLostValue: number;
  byReason: ReasonStat[];
  byEventType: BreakdownStat[];
  bySource: BreakdownStat[];
  monthly: MonthlyStat[];
}

// ─── Funcions pures ──────────────────────────────────────────────────────────

const UNCLASSIFIED = 'UNCLASSIFIED';

export function computeReasonStats(records: Pick<ArchiveRecord, 'lostReason' | 'estimatedValue'>[]): ReasonStat[] {
  const total = records.length;
  const map = new Map<string, { count: number; totalValue: number }>();
  for (const r of records) {
    const key = r.lostReason ?? UNCLASSIFIED;
    const cur = map.get(key) ?? { count: 0, totalValue: 0 };
    cur.count += 1;
    cur.totalValue += r.estimatedValue ?? 0;
    map.set(key, cur);
  }
  const result: ReasonStat[] = Array.from(map.entries()).map(([reason, agg]) => ({
    reason,
    count: agg.count,
    percentage: total === 0 ? 0 : Math.round((agg.count / total) * 1000) / 10,
    totalValue: agg.totalValue,
  }));
  result.sort((a, b) => b.count - a.count);
  return result;
}

export function computeBreakdownByEventType(records: Pick<ArchiveRecord, 'eventType' | 'estimatedValue'>[]): BreakdownStat[] {
  const map = new Map<string, { count: number; totalValue: number }>();
  for (const r of records) {
    const cur = map.get(r.eventType) ?? { count: 0, totalValue: 0 };
    cur.count += 1;
    cur.totalValue += r.estimatedValue ?? 0;
    map.set(r.eventType, cur);
  }
  return Array.from(map.entries())
    .map(([key, agg]) => ({ key, count: agg.count, totalValue: agg.totalValue }))
    .sort((a, b) => b.count - a.count);
}

export function computeBreakdownBySource(records: Pick<ArchiveRecord, 'source' | 'estimatedValue'>[]): BreakdownStat[] {
  const map = new Map<string, { count: number; totalValue: number }>();
  for (const r of records) {
    const cur = map.get(r.source) ?? { count: 0, totalValue: 0 };
    cur.count += 1;
    cur.totalValue += r.estimatedValue ?? 0;
    map.set(r.source, cur);
  }
  return Array.from(map.entries())
    .map(([key, agg]) => ({ key, count: agg.count, totalValue: agg.totalValue }))
    .sort((a, b) => b.count - a.count);
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function computeMonthlyStats(
  archivedRecords: Pick<ArchiveRecord, 'archivedAt' | 'estimatedValue'>[],
  wonLeads: { convertedAt: Date | null; createdAt: Date }[],
): MonthlyStat[] {
  const map = new Map<string, MonthlyStat>();
  const ensure = (key: string): MonthlyStat => {
    if (!map.has(key)) map.set(key, { monthKey: key, lost: 0, won: 0, lostValue: 0 });
    return map.get(key)!;
  };
  for (const r of archivedRecords) {
    const k = monthKey(r.archivedAt);
    const m = ensure(k);
    m.lost += 1;
    m.lostValue += r.estimatedValue ?? 0;
  }
  for (const w of wonLeads) {
    const ts = w.convertedAt ?? w.createdAt;
    const k = monthKey(ts);
    const m = ensure(k);
    m.won += 1;
  }
  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function computeArchiveStats(input: {
  records: Pick<ArchiveRecord, 'lostReason' | 'eventType' | 'source' | 'estimatedValue' | 'archivedAt'>[];
  wonLeads: { convertedAt: Date | null; createdAt: Date }[];
}): ArchiveStats {
  const totalLost = input.records.length;
  const totalLostValue = input.records.reduce((sum, r) => sum + (r.estimatedValue ?? 0), 0);
  return {
    totalLost,
    totalLostValue,
    byReason: computeReasonStats(input.records),
    byEventType: computeBreakdownByEventType(input.records),
    bySource: computeBreakdownBySource(input.records),
    monthly: computeMonthlyStats(input.records, input.wonLeads),
  };
}

// ─── Wrappers Prisma ─────────────────────────────────────────────────────────

function buildWhere(filters: ArchiveFilters) {
  const where: Record<string, unknown> = {};
  if (filters.lostReason) where.lostReason = filters.lostReason;
  if (filters.eventType) where.eventType = filters.eventType;
  if (filters.source) where.source = filters.source;
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.gte = filters.from;
    if (filters.to) range.lt = filters.to;
    where.archivedAt = range;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export async function loadArchiveList(
  filters: ArchiveFilters,
  pagination: ArchivePagination,
): Promise<ArchiveListResult> {
  const where = buildWhere(filters);
  const [records, total] = await Promise.all([
    prisma.leadArchive.findMany({
      where,
      orderBy: { archivedAt: 'desc' },
      skip: pagination.offset,
      take: pagination.limit,
    }),
    prisma.leadArchive.count({ where }),
  ]);
  return {
    records: records as ArchiveRecord[],
    total,
    limit: pagination.limit,
    offset: pagination.offset,
  };
}

export async function loadArchiveStats(range: { from: Date; to: Date }): Promise<ArchiveStats> {
  const [records, wonLeads] = await Promise.all([
    prisma.leadArchive.findMany({
      where: { archivedAt: { gte: range.from, lt: range.to } },
      select: {
        lostReason: true,
        eventType: true,
        source: true,
        estimatedValue: true,
        archivedAt: true,
      },
    }),
    prisma.lead.findMany({
      where: {
        status: 'WON',
        OR: [
          { convertedAt: { gte: range.from, lt: range.to } },
          { convertedAt: null, createdAt: { gte: range.from, lt: range.to } },
        ],
      },
      select: { convertedAt: true, createdAt: true },
    }),
  ]);
  return computeArchiveStats({
    records: records as Array<Pick<ArchiveRecord, 'lostReason' | 'eventType' | 'source' | 'estimatedValue' | 'archivedAt'>>,
    wonLeads,
  });
}
