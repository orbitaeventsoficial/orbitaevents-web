import { prisma } from '@/lib/prisma';
import { calculateCostPerHour } from '@/lib/inventory-utils';

const DEFAULT_MARGIN_TARGET_PCT = 0.55;
const DEFAULT_LABOR_COST_PER_HOUR = 22;
const DEFAULT_FIXED_PACK_COST = 35;
const DEFAULT_ALERT_DIVERGENCE_PCT = 20;

type PackWithInventory = {
  id: string;
  price: number;
  djHours: number;
  inventory: Array<{
    quantity: number;
    item: {
      purchasePrice: number | null;
      expectedLifeHours: number | null;
    };
  }>;
};

export type PackPricingHealth = {
  packId: string;
  recommendedPrice: number;
  publicPrice: number;
  divergencePct: number;
  hasAlert: boolean;
};

type PricingModelConfig = {
  marginTargetPct: number;
  laborCostPerHour: number;
  fixedPackCost: number;
  alertDivergencePct: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function getNumberSetting(key: string): Promise<number | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;
  const n = Number(setting.value);
  return Number.isFinite(n) ? n : null;
}

export async function getPackPricingModelConfig(): Promise<PricingModelConfig> {
  const [marginTargetPctRaw, laborCostPerHourRaw, fixedPackCostRaw, alertDivergencePctRaw] = await Promise.all([
    getNumberSetting('pricing.pack.marginTargetPct'),
    getNumberSetting('pricing.pack.laborCostPerHour'),
    getNumberSetting('pricing.pack.fixedPackCost'),
    getNumberSetting('pricing.pack.alertDivergencePct'),
  ]);

  return {
    marginTargetPct: clamp(marginTargetPctRaw ?? DEFAULT_MARGIN_TARGET_PCT, 0.1, 0.9),
    laborCostPerHour: Math.max(0, laborCostPerHourRaw ?? DEFAULT_LABOR_COST_PER_HOUR),
    fixedPackCost: Math.max(0, fixedPackCostRaw ?? DEFAULT_FIXED_PACK_COST),
    alertDivergencePct: Math.max(1, alertDivergencePctRaw ?? DEFAULT_ALERT_DIVERGENCE_PCT),
  };
}

export function computePackPricingHealth(pack: PackWithInventory, config: PricingModelConfig): PackPricingHealth {
  const inventoryCostPerHour = pack.inventory.reduce((sum, pItem) => {
    const perHour = calculateCostPerHour(pItem.item.purchasePrice, pItem.item.expectedLifeHours);
    return sum + (perHour * (pItem.quantity || 1));
  }, 0);

  const baseCost = (inventoryCostPerHour * Math.max(pack.djHours, 1))
    + (config.laborCostPerHour * Math.max(pack.djHours, 1))
    + config.fixedPackCost;

  const recommendedPrice = round2(baseCost / (1 - config.marginTargetPct));
  const publicPrice = round2(pack.price);
  const divergencePct = recommendedPrice > 0
    ? round2(((publicPrice - recommendedPrice) / recommendedPrice) * 100)
    : 0;
  const hasAlert = Math.abs(divergencePct) >= config.alertDivergencePct;

  return {
    packId: pack.id,
    recommendedPrice,
    publicPrice,
    divergencePct,
    hasAlert,
  };
}

export async function getPackPricingAlertsCount(): Promise<number> {
  const [config, packs] = await Promise.all([
    getPackPricingModelConfig(),
    prisma.pack.findMany({
      where: { isActive: true },
      select: {
        id: true,
        price: true,
        djHours: true,
        inventory: {
          select: {
            quantity: true,
            item: {
              select: {
                purchasePrice: true,
                expectedLifeHours: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return packs
    .map((pack) => computePackPricingHealth(pack, config))
    .filter((row) => row.hasAlert)
    .length;
}
