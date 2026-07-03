import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { prisma } from '@/lib/prisma';
import type { LeadSource, Prisma } from '@prisma/client';
import { computeServiceLineEconomics, computeBookingFinancialSummary, type ServiceLineLike } from './costEngine';

export type ProfitabilityConfig = {
  packCostRatio: number;
  extraCostRatio: number;
  extraHourCostRatio: number;
  /** Cost intern imputat als serveis propis d'Òrbita (DJ, tècnic…) sobre el seu PVP.
   *  Opcional al tipus: en runtime sempre el proveeixen els defaults i `normalizeProfitabilityConfig`. */
  orbitaServiceCostRatio?: number;
  fixedOperationalCost: number;
  channelCac: Record<string, number>;
};

type BookingRow = {
  id: string;
  reference: string;
  status: string;
  eventDate: Date;
  clientName: string;
  total: number;
  packPrice: number;
  extraHours: number;
  extraHourPrice: number;
  extrasTotal: number;
  serviceLinesRevenue: number;
  serviceLinesCost: number;
  serviceLines?: ServiceLineLike[];
  travelCost: number;
  source: LeadSource | 'UNKNOWN';
};

type ProfitabilityRow = BookingRow & {
  directCost: number;
  acquisitionCost: number;
  netMargin: number;
  marginPct: number;
  travelCost: number;
};

type ProfitabilityReport = {
  generatedAt: string;
  config: ProfitabilityConfig;
  realized: { bookings: number; revenue: number; netMargin: number; avgMarginPct: number; };
  forecast: { bookings: number; revenue: number; netMargin: number; avgMarginPct: number; };
  bySource: Array<{ source: string; bookings: number; revenue: number; netMargin: number; avgMarginPct: number; }>;
  topProfitability: ProfitabilityRow[];
  riskProfitability: ProfitabilityRow[];
};

const DEFAULT_CONFIG: ProfitabilityConfig = PROFITABILITY_MODEL_DEFAULTS;
const PROFITABILITY_BATCH_SIZE = 500;

export const DEFAULT_PROFITABILITY_CONFIG = DEFAULT_CONFIG;
function clampRatio(input: unknown, fallback: number): number { const n = Number(input); if (!Number.isFinite(n)) return fallback; return Math.max(0, Math.min(1, n)); }
function parseNumber(input: unknown, fallback: number): number { const n = Number(input); if (!Number.isFinite(n)) return fallback; return n; }

export function normalizeProfitabilityConfig(rawInput: unknown): ProfitabilityConfig {
  if (!rawInput || typeof rawInput !== 'object') return DEFAULT_CONFIG;
  const raw = rawInput as Record<string, unknown>;
  const rawCac = (raw.channelCac && typeof raw.channelCac === 'object' ? raw.channelCac : {}) as Record<string, unknown>;
  const channelCac = { ...DEFAULT_CONFIG.channelCac };
  Object.keys(channelCac).forEach((key) => { channelCac[key] = parseNumber(rawCac[key], channelCac[key]); });
  return {
    packCostRatio: clampRatio(raw.packCostRatio, DEFAULT_CONFIG.packCostRatio),
    extraCostRatio: clampRatio(raw.extraCostRatio, DEFAULT_CONFIG.extraCostRatio),
    extraHourCostRatio: clampRatio(raw.extraHourCostRatio, DEFAULT_CONFIG.extraHourCostRatio),
    orbitaServiceCostRatio: clampRatio(raw.orbitaServiceCostRatio, PROFITABILITY_MODEL_DEFAULTS.orbitaServiceCostRatio),
    fixedOperationalCost: parseNumber(raw.fixedOperationalCost, DEFAULT_CONFIG.fixedOperationalCost),
    channelCac,
  };
}

export async function getProfitabilityConfig(): Promise<ProfitabilityConfig> {
  const setting = await prisma.setting.findUnique({ where: { key: 'finance.profitabilityConfig' } });
  if (!setting?.value) return DEFAULT_CONFIG;
  try { return normalizeProfitabilityConfig(JSON.parse(setting.value)); } catch { return DEFAULT_CONFIG; }
}

export async function upsertProfitabilityConfig(input: ProfitabilityConfig, role?: string | null): Promise<ProfitabilityConfig> {
  const previous = await getProfitabilityConfig();
  const normalized = normalizeProfitabilityConfig(input);
  await prisma.setting.upsert({
    where: { key: 'finance.profitabilityConfig' },
    update: {
      value: JSON.stringify(normalized),
      type: 'JSON',
      category: 'pricing',
      label: 'Config rendibilitat',
      description: 'Ràtios de cost i CAC per canal per a informe de rendibilitat',
    },
    create: {
      key: 'finance.profitabilityConfig',
      value: JSON.stringify(normalized),
      type: 'JSON',
      category: 'pricing',
      label: 'Config rendibilitat',
      description: 'Ràtios de cost i CAC per canal per a informe de rendibilitat',
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'setting',
      entityId: 'finance.profitabilityConfig',
      details: { key: 'finance.profitabilityConfig', role, before: previous, after: normalized },
    },
  }).catch(() => undefined);

  return normalized;
}

function toProfitabilityRow(row: BookingRow, config: ProfitabilityConfig): ProfitabilityRow {
  const summary = computeBookingFinancialSummary({
    total: row.total,
    packPrice: row.packPrice,
    extrasTotal: row.extrasTotal,
    extraHours: row.extraHours,
    extraHourPrice: row.extraHourPrice,
    distanceKm: 0,
    travelCost: row.travelCost,
    source: row.source,
    serviceLinesRevenue: row.serviceLinesRevenue,
    serviceLinesCost: row.serviceLinesCost,
    serviceLines: row.serviceLines,
  }, config);
  return { ...row, directCost: summary.directCost, acquisitionCost: summary.acquisitionCost, netMargin: summary.netMargin, marginPct: summary.marginPct / 100 };
}

function summarize(rows: ProfitabilityRow[]) {
  const revenue = rows.reduce((sum, row) => sum + row.total, 0);
  const netMargin = rows.reduce((sum, row) => sum + row.netMargin, 0);
  return { bookings: rows.length, revenue, netMargin, avgMarginPct: revenue > 0 ? netMargin / revenue : 0 };
}

async function fetchProfitabilityBookings() {
  const where: Prisma.BookingWhereInput = { status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] } };
  const includeWithLead = {
    pack: { select: { price: true, extraHourPrice: true } },
    extras: { select: { price: true, quantity: true } },
    serviceLines: { select: { revenueAmount: true, costAmount: true, quantity: true, collaboratorId: true, kind: true, label: true } },
    lead: { select: { source: true } },
  };
  const includeWithoutLead = {
    pack: { select: { price: true, extraHourPrice: true } },
    extras: { select: { price: true, quantity: true } },
    serviceLines: { select: { revenueAmount: true, costAmount: true, quantity: true, collaboratorId: true, kind: true, label: true } },
  };

  const readAll = async (include: typeof includeWithLead | typeof includeWithoutLead) => {
    const bookings: Array<Record<string, unknown>> = [];
    let cursorId: string | undefined;
    let hasMoreBookings = true;

    while (hasMoreBookings) {
      const batch = await prisma.booking.findMany({
        where,
        orderBy: { id: 'asc' },
        take: PROFITABILITY_BATCH_SIZE,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        include,
      });

      if (batch.length === 0) break;
      bookings.push(...(JSON.parse(JSON.stringify(batch)) as Array<Record<string, unknown>>));
      cursorId = batch[batch.length - 1]?.id ?? '';
      hasMoreBookings = Boolean(cursorId) && batch.length === PROFITABILITY_BATCH_SIZE;
    }

    return bookings;
  };

  try {
    return await readAll(includeWithLead);
  } catch {
    return readAll(includeWithoutLead);
  }
}

export async function buildProfitabilityReport(): Promise<ProfitabilityReport> {
  const config = await getProfitabilityConfig();
  const bookings = await fetchProfitabilityBookings();

  const rows: ProfitabilityRow[] = bookings.map((booking) => {
    const packObj = (booking.pack && typeof booking.pack === 'object') ? (booking.pack as { price?: number; extraHourPrice?: number }) : null;
    const extrasObj = Array.isArray(booking.extras) ? booking.extras as Array<{ price?: number; quantity?: number }> : [];
    const serviceLinesObj = Array.isArray(booking.serviceLines)
      ? booking.serviceLines as ServiceLineLike[]
      : [];
    const leadObj = (booking.lead && typeof booking.lead === 'object') ? (booking.lead as { source?: string }) : null;
    const extrasTotal = extrasObj.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const serviceLines = computeServiceLineEconomics(serviceLinesObj);
    const travelCost = typeof booking.travelCost === 'number' ? booking.travelCost : 0;
    const sourceValue = typeof leadObj?.source === 'string' ? leadObj.source : 'UNKNOWN';
    const base: BookingRow = {
      id: String(booking.id || ''), reference: String(booking.reference || ''), status: String(booking.status || 'UNKNOWN'), eventDate: booking.eventDate instanceof Date ? booking.eventDate : new Date(), clientName: String(booking.clientName || 'Client'), total: Number(booking.total) || 0, packPrice: Number(packObj?.price) || 0, extraHours: Number(booking.extraHours) || 0, extraHourPrice: Number(packObj?.extraHourPrice) || 0, extrasTotal, serviceLinesRevenue: serviceLines.revenue, serviceLinesCost: serviceLines.cost, serviceLines: serviceLinesObj, travelCost, source: sourceValue as LeadSource | 'UNKNOWN',
    };
    return toProfitabilityRow(base, config);
  });

  const realizedRows = rows.filter((row) => row.status === 'COMPLETED');
  const forecastRows = rows.filter((row) => row.status === 'CONFIRMED' || row.status === 'PREPARING');
  const bySourceMap = new Map<string, ProfitabilityRow[]>();
  rows.forEach((row) => { const key = row.source || 'UNKNOWN'; const list = bySourceMap.get(key) || []; list.push(row); bySourceMap.set(key, list); });
  const bySource = Array.from(bySourceMap.entries()).map(([source, sourceRows]) => ({ source, ...summarize(sourceRows) })).sort((a, b) => b.revenue - a.revenue);
  const topProfitability = [...realizedRows].sort((a, b) => b.netMargin - a.netMargin).slice(0, 25);
  const riskProfitability = [...rows].filter((row) => row.netMargin < 0 || row.marginPct < 0.15).sort((a, b) => a.netMargin - b.netMargin).slice(0, 25);

  return { generatedAt: new Date().toISOString(), config, realized: summarize(realizedRows), forecast: summarize(forecastRows), bySource, topProfitability, riskProfitability };
}
