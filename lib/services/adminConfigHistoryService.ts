import { prisma } from '@/lib/prisma';
import { normalizeProfitabilityConfig, type ProfitabilityConfig } from '@/lib/services/profitabilityService';
import type { PackPricingModelConfig } from '@/lib/services/packPricingHealth';

export type ProfitabilityConfigHistoryEntry = {
  id: string;
  createdAt: string;
  role: string;
  before: ProfitabilityConfig;
  after: ProfitabilityConfig;
};

export type PackPricingModelHistoryEntry = {
  id: string;
  createdAt: string;
  role: string;
  before: PackPricingModelConfig;
  after: PackPricingModelConfig;
};

export function normalizePackPricingConfigHistory(
  raw: unknown,
  fallback: PackPricingModelConfig
): PackPricingModelConfig {
  if (!raw || typeof raw !== 'object') return fallback;
  const value = raw as Record<string, unknown>;
  const parseNum = (key: keyof PackPricingModelConfig) => {
    const n = Number(value[key]);
    return Number.isFinite(n) ? n : fallback[key] as number;
  };

  const specialistServicesRaw = value.specialistServices;
  const specialistServices = Array.isArray(specialistServicesRaw)
    ? specialistServicesRaw.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
    : String(specialistServicesRaw ?? fallback.specialistServices.join(','))
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

  return {
    marginTargetPct: Math.max(0.1, Math.min(0.9, parseNum('marginTargetPct'))),
    socialSecurityPct: Math.max(0, Math.min(1, parseNum('socialSecurityPct'))),
    withholdingPct: Math.max(0, Math.min(1, parseNum('withholdingPct'))),
    operatorNetCostPerHour: Math.max(0, parseNum('operatorNetCostPerHour')),
    specialistNetCostPerHour: Math.max(0, parseNum('specialistNetCostPerHour')),
    operatorCostPerHour: Math.max(0, parseNum('operatorCostPerHour')),
    specialistCostPerHour: Math.max(0, parseNum('specialistCostPerHour')),
    specialistServices,
    supportOperatorMinGuests: Math.max(1, parseNum('supportOperatorMinGuests')),
    supportOperatorMinDjHours: Math.max(1, parseNum('supportOperatorMinDjHours')),
    supportOperatorMinWatts: Math.max(1, parseNum('supportOperatorMinWatts')),
    fixedPackCost: Math.max(0, parseNum('fixedPackCost')),
    alertDivergencePct: Math.max(1, parseNum('alertDivergencePct')),
  };
}

export async function readProfitabilityConfigHistory(limit: number = 120): Promise<ProfitabilityConfigHistoryEntry[]> {
  const historyLogs = await prisma.adminLog.findMany({
    where: {
      entity: 'setting',
      entityId: 'finance.profitabilityConfig',
      action: 'UPDATE',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return historyLogs.map((logItem) => {
    const details = (logItem.details && typeof logItem.details === 'object'
      ? (logItem.details as Record<string, unknown>)
      : {}) as Record<string, unknown>;

    return {
      id: logItem.id,
      createdAt: logItem.createdAt.toISOString(),
      role: typeof details.role === 'string' ? details.role : 'OWNER',
      before: normalizeProfitabilityConfig(details.before),
      after: normalizeProfitabilityConfig(details.after),
    };
  });
}

export async function readPackPricingModelHistory(
  fallback: PackPricingModelConfig,
  limit: number = 120
): Promise<PackPricingModelHistoryEntry[]> {
  const historyLogs = await prisma.adminLog.findMany({
    where: {
      entity: 'setting',
      entityId: 'pricing.pack.modelConfig',
      action: 'UPDATE',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return historyLogs.map((logItem) => {
    const details = (logItem.details && typeof logItem.details === 'object'
      ? (logItem.details as Record<string, unknown>)
      : {}) as Record<string, unknown>;

    return {
      id: logItem.id,
      createdAt: logItem.createdAt.toISOString(),
      role: typeof details.role === 'string' ? details.role : 'OWNER',
      before: normalizePackPricingConfigHistory(details.before, fallback),
      after: normalizePackPricingConfigHistory(details.after, fallback),
    };
  });
}
