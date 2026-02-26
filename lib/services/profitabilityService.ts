import { prisma } from '@/lib/prisma';
import type { LeadSource } from '@prisma/client';
import { computeBookingFinancialSummary } from './costEngine';

export type ProfitabilityConfig = {
  packCostRatio: number;
  extraCostRatio: number;
  extraHourCostRatio: number;
  fixedOperationalCost: number;
  channelCac: Record<string, number>;
};

export type ProfitabilityConfigInput = ProfitabilityConfig;

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
  travelCost: number;
  source: LeadSource | 'UNKNOWN';
};

export type ProfitabilityRow = BookingRow & {
  directCost: number;
  acquisitionCost: number;
  netMargin: number;
  marginPct: number;
  travelCost: number;
};

export type ProfitabilityReport = {
  generatedAt: string;
  config: ProfitabilityConfig;
  realized: {
    bookings: number;
    revenue: number;
    netMargin: number;
    avgMarginPct: number;
  };
  forecast: {
    bookings: number;
    revenue: number;
    netMargin: number;
    avgMarginPct: number;
  };
  bySource: Array<{
    source: string;
    bookings: number;
    revenue: number;
    netMargin: number;
    avgMarginPct: number;
  }>;
  topProfitability: ProfitabilityRow[];
  riskProfitability: ProfitabilityRow[];
};

const DEFAULT_CONFIG: ProfitabilityConfig = {
  packCostRatio: 0.36,
  extraCostRatio: 0.28,
  extraHourCostRatio: 0.2,
  fixedOperationalCost: 45,
  channelCac: {
    WEBSITE: 22,
    CONFIGURATOR: 18,
    PHONE: 12,
    WHATSAPP: 10,
    INSTAGRAM: 35,
    WALLAPOP: 16,
    REFERRAL: 8,
    GOOGLE: 28,
    OTHER: 20,
    UNKNOWN: 20,
  },
};

export const DEFAULT_PROFITABILITY_CONFIG = DEFAULT_CONFIG;

function clampRatio(input: unknown, fallback: number): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function parseNumber(input: unknown, fallback: number): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export function normalizeProfitabilityConfig(rawInput: unknown): ProfitabilityConfig {
  if (!rawInput || typeof rawInput !== 'object') return DEFAULT_CONFIG;
  const raw = rawInput as Record<string, unknown>;
  const rawCac = (raw.channelCac && typeof raw.channelCac === 'object'
    ? raw.channelCac
    : {}) as Record<string, unknown>;

  const channelCac = { ...DEFAULT_CONFIG.channelCac };
  Object.keys(channelCac).forEach((key) => {
    channelCac[key] = parseNumber(rawCac[key], channelCac[key]);
  });

  return {
    packCostRatio: clampRatio(raw.packCostRatio, DEFAULT_CONFIG.packCostRatio),
    extraCostRatio: clampRatio(raw.extraCostRatio, DEFAULT_CONFIG.extraCostRatio),
    extraHourCostRatio: clampRatio(raw.extraHourCostRatio, DEFAULT_CONFIG.extraHourCostRatio),
    fixedOperationalCost: parseNumber(raw.fixedOperationalCost, DEFAULT_CONFIG.fixedOperationalCost),
    channelCac,
  };
}

export async function getProfitabilityConfig(): Promise<ProfitabilityConfig> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'finance.profitabilityConfig' },
  });
  if (!setting?.value) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(setting.value);
    return normalizeProfitabilityConfig(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function upsertProfitabilityConfig(input: ProfitabilityConfigInput): Promise<ProfitabilityConfig> {
  const normalized = normalizeProfitabilityConfig(input);
  await prisma.setting.upsert({
    where: { key: 'finance.profitabilityConfig' },
    update: {
      value: JSON.stringify(normalized),
      type: 'JSON',
      category: 'pricing',
      label: 'Config rentabilidad',
      description: 'Ratios de coste y CAC por canal para reporte de rentabilidad',
    },
    create: {
      key: 'finance.profitabilityConfig',
      value: JSON.stringify(normalized),
      type: 'JSON',
      category: 'pricing',
      label: 'Config rentabilidad',
      description: 'Ratios de coste y CAC por canal para reporte de rentabilidad',
    },
  });
  return normalized;
}

function toProfitabilityRow(row: BookingRow, config: ProfitabilityConfig): ProfitabilityRow {
  const summary = computeBookingFinancialSummary(
    {
      total: row.total,
      packPrice: row.packPrice,
      extrasTotal: row.extrasTotal,
      extraHours: row.extraHours,
      extraHourPrice: row.extraHourPrice,
      distanceKm: 0,
      travelCost: row.travelCost,
      source: row.source,
    },
    config,
  );

  return {
    ...row,
    directCost: summary.directCost,
    acquisitionCost: summary.acquisitionCost,
    netMargin: summary.netMargin,
    marginPct: summary.marginPct / 100, // ProfitabilityRow espera ratio 0-1
  };
}

function summarize(rows: ProfitabilityRow[]) {
  const revenue = rows.reduce((sum, row) => sum + row.total, 0);
  const netMargin = rows.reduce((sum, row) => sum + row.netMargin, 0);
  return {
    bookings: rows.length,
    revenue,
    netMargin,
    avgMarginPct: revenue > 0 ? netMargin / revenue : 0,
  };
}

export async function buildProfitabilityReport(): Promise<ProfitabilityReport> {
  const config = await getProfitabilityConfig();

  let bookings: Array<Record<string, unknown>> = [];
  try {
    bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] },
      },
      orderBy: { eventDate: 'desc' },
      include: {
        pack: { select: { price: true, extraHourPrice: true } },
        extras: { select: { price: true, quantity: true } },
        lead: { select: { source: true } },
      },
      take: 1500,
    }) as unknown as Array<Record<string, unknown>>;
  } catch {
    // Fallback resilient: if lead/source enum or relation data is dirty,
    // continue profitability calculation with source UNKNOWN.
    bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] },
      },
      orderBy: { eventDate: 'desc' },
      include: {
        pack: { select: { price: true, extraHourPrice: true } },
        extras: { select: { price: true, quantity: true } },
      },
      take: 1500,
    }) as unknown as Array<Record<string, unknown>>;
  }

  const rows: ProfitabilityRow[] = bookings.map((booking) => {
    const packObj = (booking.pack && typeof booking.pack === 'object')
      ? (booking.pack as { price?: number; extraHourPrice?: number })
      : null;
    const extrasObj = Array.isArray(booking.extras)
      ? booking.extras as Array<{ price?: number; quantity?: number }>
      : [];
    const leadObj = (booking.lead && typeof booking.lead === 'object')
      ? (booking.lead as { source?: string })
      : null;
    const extrasTotal = extrasObj.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const travelCost = typeof booking.travelCost === 'number' ? booking.travelCost : 0;
    const sourceValue = typeof leadObj?.source === 'string' ? leadObj.source : 'UNKNOWN';

    const base: BookingRow = {
      id: String(booking.id || ''),
      reference: String(booking.reference || ''),
      status: String(booking.status || 'UNKNOWN'),
      eventDate: booking.eventDate instanceof Date ? booking.eventDate : new Date(),
      clientName: String(booking.clientName || 'Client'),
      total: Number(booking.total) || 0,
      packPrice: Number(packObj?.price) || 0,
      extraHours: Number(booking.extraHours) || 0,
      extraHourPrice: Number(packObj?.extraHourPrice) || 0,
      extrasTotal,
      travelCost,
      source: sourceValue as LeadSource | 'UNKNOWN',
    };
    return toProfitabilityRow(base, config);
  });

  const realizedRows = rows.filter((row) => row.status === 'COMPLETED');
  const forecastRows = rows.filter((row) => row.status === 'CONFIRMED' || row.status === 'PREPARING');

  const bySourceMap = new Map<string, ProfitabilityRow[]>();
  rows.forEach((row) => {
    const key = row.source || 'UNKNOWN';
    const list = bySourceMap.get(key) || [];
    list.push(row);
    bySourceMap.set(key, list);
  });

  const bySource = Array.from(bySourceMap.entries())
    .map(([source, sourceRows]) => {
      const summary = summarize(sourceRows);
      return {
        source,
        ...summary,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const topProfitability = [...realizedRows]
    .sort((a, b) => b.netMargin - a.netMargin)
    .slice(0, 25);

  const riskProfitability = [...rows]
    .filter((row) => row.netMargin < 0 || row.marginPct < 0.15)
    .sort((a, b) => a.netMargin - b.netMargin)
    .slice(0, 25);

  return {
    generatedAt: new Date().toISOString(),
    config,
    realized: summarize(realizedRows),
    forecast: summarize(forecastRows),
    bySource,
    topProfitability,
    riskProfitability,
  };
}
