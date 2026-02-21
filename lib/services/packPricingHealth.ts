import { prisma } from '@/lib/prisma';
import { calculateCostPerHour } from '@/lib/inventory-utils';

const DEFAULT_MARGIN_TARGET_PCT = 0.55;
const DEFAULT_LABOR_COST_PER_HOUR = 22;
const DEFAULT_SPECIALIST_MULTIPLIER = 1.35;
const DEFAULT_FIXED_PACK_COST = 35;
const DEFAULT_ALERT_DIVERGENCE_PCT = 20;
const DEFAULT_SOCIAL_SECURITY_PCT = 0.32;
const DEFAULT_IRPF_PCT = 0.15;
const DEFAULT_SPECIALIST_SERVICES = ['bodas', 'produccion', 'empresas'];

type PackWithInventory = {
  id: string;
  service: string | null;
  price: number;
  extraHourPrice: number;
  djHours: number;
  maxGuests?: number | null;
  soundWatts?: number | null;
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
  recommendedExtraHourPrice: number;
  publicExtraHourPrice: number;
  extraHourDivergencePct: number;
  extraHourAlert: boolean;
  recommendedOperatorExtraHourPrice: number;
  laborNetCostPerHourUsed: number;
  laborCostPerHourUsed: number;
  socialSecurityPct: number;
  withholdingPct: number;
  laborNetAfterWithholdingPerHourUsed: number;
  specialistCount: number;
  operatorCount: number;
  laborTier: 'mixed';
  hasAlert: boolean;
};

type PricingModelConfig = {
  marginTargetPct: number;
  socialSecurityPct: number;
  withholdingPct: number;
  operatorNetCostPerHour: number;
  specialistNetCostPerHour: number;
  operatorCostPerHour: number;
  specialistCostPerHour: number;
  specialistServices: Set<string>;
  supportOperatorMinGuests: number;
  supportOperatorMinDjHours: number;
  supportOperatorMinWatts: number;
  fixedPackCost: number;
  alertDivergencePct: number;
};

export type PackPricingModelConfig = {
  marginTargetPct: number;
  socialSecurityPct: number;
  withholdingPct: number;
  operatorNetCostPerHour: number;
  specialistNetCostPerHour: number;
  operatorCostPerHour: number;
  specialistCostPerHour: number;
  specialistServices: string[];
  supportOperatorMinGuests: number;
  supportOperatorMinDjHours: number;
  supportOperatorMinWatts: number;
  fixedPackCost: number;
  alertDivergencePct: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizePercent(input: number | null | undefined, fallback: number): number {
  if (input == null || !Number.isFinite(input)) return fallback;
  if (input > 1) return clamp(input / 100, 0, 1);
  return clamp(input, 0, 1);
}

async function getNumberSetting(key: string): Promise<number | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;
  const n = Number(setting.value);
  return Number.isFinite(n) ? n : null;
}

export async function getPackPricingModelConfig(): Promise<PricingModelConfig> {
  const [
    marginTargetPctRaw,
    laborCostPerHourRaw,
    socialSecurityPctRaw,
    withholdingPctRaw,
    operatorNetCostPerHourRaw,
    specialistNetCostPerHourRaw,
    operatorCostPerHourRaw,
    specialistCostPerHourRaw,
    specialistServicesRaw,
    supportOperatorMinGuestsRaw,
    supportOperatorMinDjHoursRaw,
    supportOperatorMinWattsRaw,
    specialistMultiplierRaw,
    fixedPackCostRaw,
    alertDivergencePctRaw,
  ] = await Promise.all([
    getNumberSetting('pricing.pack.marginTargetPct'),
    getNumberSetting('pricing.pack.laborCostPerHour'),
    getNumberSetting('pricing.pack.socialSecurityPct'),
    getNumberSetting('pricing.pack.irpfPct'),
    getNumberSetting('pricing.pack.operatorNetCostPerHour'),
    getNumberSetting('pricing.pack.specialistNetCostPerHour'),
    getNumberSetting('pricing.pack.operatorCostPerHour'),
    getNumberSetting('pricing.pack.specialistCostPerHour'),
    prisma.setting.findUnique({ where: { key: 'pricing.pack.specialistServices' } }),
    getNumberSetting('pricing.pack.supportOperatorMinGuests'),
    getNumberSetting('pricing.pack.supportOperatorMinDjHours'),
    getNumberSetting('pricing.pack.supportOperatorMinWatts'),
    getNumberSetting('pricing.pack.specialistMultiplier'),
    getNumberSetting('pricing.pack.fixedPackCost'),
    getNumberSetting('pricing.pack.alertDivergencePct'),
  ]);
  const socialSecurityPct = normalizePercent(socialSecurityPctRaw, DEFAULT_SOCIAL_SECURITY_PCT);
  const withholdingPct = normalizePercent(withholdingPctRaw, DEFAULT_IRPF_PCT);
  const baseLabor = Math.max(0, laborCostPerHourRaw ?? DEFAULT_LABOR_COST_PER_HOUR);
  const specialistMultiplier = Math.max(1, specialistMultiplierRaw ?? DEFAULT_SPECIALIST_MULTIPLIER);
  const fallbackOperatorGross = Math.max(0, operatorCostPerHourRaw ?? baseLabor);
  const operatorNetCostPerHour = Math.max(
    0,
    operatorNetCostPerHourRaw ?? (fallbackOperatorGross / (1 + socialSecurityPct))
  );
  const operatorCostPerHour = Math.max(
    0,
    operatorCostPerHourRaw ?? round2(operatorNetCostPerHour * (1 + socialSecurityPct))
  );
  const fallbackSpecialistGross = Math.max(
    0,
    specialistCostPerHourRaw ?? (operatorCostPerHour * specialistMultiplier)
  );
  const specialistNetCostPerHour = Math.max(
    0,
    specialistNetCostPerHourRaw ?? (fallbackSpecialistGross / (1 + socialSecurityPct))
  );
  const specialistCostPerHour = Math.max(
    0,
    specialistCostPerHourRaw ?? round2(specialistNetCostPerHour * (1 + socialSecurityPct))
  );
  const specialistServices = new Set(
    (specialistServicesRaw?.value || DEFAULT_SPECIALIST_SERVICES.join(','))
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
  );

  return {
    marginTargetPct: clamp(marginTargetPctRaw ?? DEFAULT_MARGIN_TARGET_PCT, 0.1, 0.9),
    socialSecurityPct,
    withholdingPct,
    operatorNetCostPerHour,
    specialistNetCostPerHour,
    operatorCostPerHour,
    specialistCostPerHour,
    specialistServices,
    supportOperatorMinGuests: Math.max(1, supportOperatorMinGuestsRaw ?? 150),
    supportOperatorMinDjHours: Math.max(1, supportOperatorMinDjHoursRaw ?? 6),
    supportOperatorMinWatts: Math.max(1, supportOperatorMinWattsRaw ?? 6000),
    fixedPackCost: Math.max(0, fixedPackCostRaw ?? DEFAULT_FIXED_PACK_COST),
    alertDivergencePct: Math.max(1, alertDivergencePctRaw ?? DEFAULT_ALERT_DIVERGENCE_PCT),
  };
}

function normalizeSpecialistServices(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
  }
  return String(raw)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function toEditablePackPricingModelConfig(config: PricingModelConfig): PackPricingModelConfig {
  return {
    marginTargetPct: config.marginTargetPct,
    socialSecurityPct: config.socialSecurityPct,
    withholdingPct: config.withholdingPct,
    operatorNetCostPerHour: config.operatorNetCostPerHour,
    specialistNetCostPerHour: config.specialistNetCostPerHour,
    operatorCostPerHour: config.operatorCostPerHour,
    specialistCostPerHour: config.specialistCostPerHour,
    specialistServices: Array.from(config.specialistServices),
    supportOperatorMinGuests: config.supportOperatorMinGuests,
    supportOperatorMinDjHours: config.supportOperatorMinDjHours,
    supportOperatorMinWatts: config.supportOperatorMinWatts,
    fixedPackCost: config.fixedPackCost,
    alertDivergencePct: config.alertDivergencePct,
  };
}

export async function getPackPricingModelConfigEditable(): Promise<PackPricingModelConfig> {
  const config = await getPackPricingModelConfig();
  return toEditablePackPricingModelConfig(config);
}

export async function upsertPackPricingModelConfig(input: Partial<PackPricingModelConfig>): Promise<PackPricingModelConfig> {
  const current = await getPackPricingModelConfigEditable();
  const candidate: PackPricingModelConfig = {
    marginTargetPct: clamp(Number(input.marginTargetPct ?? current.marginTargetPct), 0.1, 0.9),
    socialSecurityPct: normalizePercent(Number(input.socialSecurityPct ?? current.socialSecurityPct), current.socialSecurityPct),
    withholdingPct: normalizePercent(Number(input.withholdingPct ?? current.withholdingPct), current.withholdingPct),
    operatorNetCostPerHour: Math.max(0, Number(input.operatorNetCostPerHour ?? current.operatorNetCostPerHour)),
    specialistNetCostPerHour: Math.max(0, Number(input.specialistNetCostPerHour ?? current.specialistNetCostPerHour)),
    operatorCostPerHour: Math.max(0, Number(input.operatorCostPerHour ?? current.operatorCostPerHour)),
    specialistCostPerHour: Math.max(0, Number(input.specialistCostPerHour ?? current.specialistCostPerHour)),
    specialistServices: normalizeSpecialistServices(input.specialistServices ?? current.specialistServices),
    supportOperatorMinGuests: Math.max(1, Number(input.supportOperatorMinGuests ?? current.supportOperatorMinGuests)),
    supportOperatorMinDjHours: Math.max(1, Number(input.supportOperatorMinDjHours ?? current.supportOperatorMinDjHours)),
    supportOperatorMinWatts: Math.max(1, Number(input.supportOperatorMinWatts ?? current.supportOperatorMinWatts)),
    fixedPackCost: Math.max(0, Number(input.fixedPackCost ?? current.fixedPackCost)),
    alertDivergencePct: Math.max(1, Number(input.alertDivergencePct ?? current.alertDivergencePct)),
  };

  const payload: Array<{ key: string; value: string; label: string; description: string }> = [
    { key: 'pricing.pack.marginTargetPct', value: String(candidate.marginTargetPct), label: 'Objectiu marge packs', description: 'Percentatge objectiu de marge net dels packs' },
    { key: 'pricing.pack.socialSecurityPct', value: String(candidate.socialSecurityPct), label: 'SS empresa', description: 'Percentatge de seguretat social aplicat al cost laboral' },
    { key: 'pricing.pack.irpfPct', value: String(candidate.withholdingPct), label: 'Retenció IRPF', description: 'Percentatge de retenció aplicat al cost laboral' },
    { key: 'pricing.pack.operatorNetCostPerHour', value: String(candidate.operatorNetCostPerHour), label: 'Operari net hora', description: 'Cost net hora operari' },
    { key: 'pricing.pack.specialistNetCostPerHour', value: String(candidate.specialistNetCostPerHour), label: 'Especialista net hora', description: 'Cost net hora especialista' },
    { key: 'pricing.pack.operatorCostPerHour', value: String(candidate.operatorCostPerHour), label: 'Operari brut hora', description: 'Cost brut hora operari' },
    { key: 'pricing.pack.specialistCostPerHour', value: String(candidate.specialistCostPerHour), label: 'Especialista brut hora', description: 'Cost brut hora especialista' },
    { key: 'pricing.pack.specialistServices', value: candidate.specialistServices.join(','), label: 'Serveis especialista', description: 'Serveis que requereixen especialista' },
    { key: 'pricing.pack.supportOperatorMinGuests', value: String(candidate.supportOperatorMinGuests), label: 'Llindar convidats operari', description: 'Convidats mínims per afegir operari de suport' },
    { key: 'pricing.pack.supportOperatorMinDjHours', value: String(candidate.supportOperatorMinDjHours), label: 'Llindar hores DJ operari', description: 'Hores mínimes de DJ per afegir operari de suport' },
    { key: 'pricing.pack.supportOperatorMinWatts', value: String(candidate.supportOperatorMinWatts), label: 'Llindar watts operari', description: 'Potència mínima per afegir operari de suport' },
    { key: 'pricing.pack.fixedPackCost', value: String(candidate.fixedPackCost), label: 'Cost fix pack', description: 'Cost operatiu fix per pack' },
    { key: 'pricing.pack.alertDivergencePct', value: String(candidate.alertDivergencePct), label: 'Llindar alerta divergència', description: 'Diferència % a partir de la qual salta alerta de PVP vs recomanat' },
  ];

  await prisma.$transaction(
    payload.map((row) => {
      const settingType = row.key === 'pricing.pack.specialistServices' ? 'STRING' : 'NUMBER';
      return (
      prisma.setting.upsert({
        where: { key: row.key },
        update: {
          value: row.value,
          type: settingType,
          category: 'pricing',
          label: row.label,
          description: row.description,
        },
        create: {
          key: row.key,
          value: row.value,
          type: settingType,
          category: 'pricing',
          label: row.label,
          description: row.description,
        },
      })
      );
    })
  );

  return candidate;
}

function getSupportOperatorCount(pack: PackWithInventory, config: PricingModelConfig): number {
  const guests = pack.maxGuests || 0;
  const watts = pack.soundWatts || 0;
  const longShift = pack.djHours >= config.supportOperatorMinDjHours;
  const highCapacity = guests >= config.supportOperatorMinGuests;
  const highPower = watts >= config.supportOperatorMinWatts;
  return longShift || highCapacity || highPower ? 1 : 0;
}

export function computePackPricingHealth(pack: PackWithInventory, config: PricingModelConfig): PackPricingHealth {
  const inventoryCostPerHour = pack.inventory.reduce((sum, pItem) => {
    const perHour = calculateCostPerHour(pItem.item.purchasePrice, pItem.item.expectedLifeHours);
    return sum + (perHour * (pItem.quantity || 1));
  }, 0);

  const specialistCount = 1;
  const operatorCount = getSupportOperatorCount(pack, config);
  const laborNetCostPerHourUsed = (specialistCount * config.specialistNetCostPerHour) + (operatorCount * config.operatorNetCostPerHour);
  const laborCostPerHourUsed = (specialistCount * config.specialistCostPerHour) + (operatorCount * config.operatorCostPerHour);
  const laborNetAfterWithholdingPerHourUsed = round2(laborCostPerHourUsed * (1 - config.withholdingPct));
  const laborTier: 'mixed' = 'mixed';

  const baseCost = (inventoryCostPerHour * Math.max(pack.djHours, 1))
    + (laborCostPerHourUsed * Math.max(pack.djHours, 1))
    + config.fixedPackCost;

  const recommendedPrice = round2(baseCost / (1 - config.marginTargetPct));
  const publicPrice = round2(pack.price);
  const divergencePct = recommendedPrice > 0
    ? round2(((publicPrice - recommendedPrice) / recommendedPrice) * 100)
    : 0;
  const baseExtraHourCost = inventoryCostPerHour + laborCostPerHourUsed;
  const recommendedExtraHourPrice = round2(baseExtraHourCost / (1 - config.marginTargetPct));
  const baseOperatorExtraHourCost = inventoryCostPerHour + config.operatorCostPerHour;
  const recommendedOperatorExtraHourPrice = round2(baseOperatorExtraHourCost / (1 - config.marginTargetPct));
  const publicExtraHourPrice = round2(pack.extraHourPrice || 0);
  const extraHourDivergencePct = recommendedExtraHourPrice > 0
    ? round2(((publicExtraHourPrice - recommendedExtraHourPrice) / recommendedExtraHourPrice) * 100)
    : 0;

  const packAlert = Math.abs(divergencePct) >= config.alertDivergencePct;
  const extraHourAlert = Math.abs(extraHourDivergencePct) >= config.alertDivergencePct;
  const hasAlert = packAlert || extraHourAlert;

  return {
    packId: pack.id,
    recommendedPrice,
    publicPrice,
    divergencePct,
    recommendedExtraHourPrice,
    recommendedOperatorExtraHourPrice,
    publicExtraHourPrice,
    extraHourDivergencePct,
    extraHourAlert,
    laborNetCostPerHourUsed,
    laborCostPerHourUsed,
    socialSecurityPct: config.socialSecurityPct,
    withholdingPct: config.withholdingPct,
    laborNetAfterWithholdingPerHourUsed,
    specialistCount,
    operatorCount,
    laborTier,
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
        service: true,
        price: true,
        extraHourPrice: true,
        djHours: true,
        maxGuests: true,
        soundWatts: true,
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

export async function syncPackPublicPricesToRecommended(): Promise<{
  updated: number;
  reviewed: number;
}> {
  const [config, packs] = await Promise.all([
    getPackPricingModelConfig(),
    prisma.pack.findMany({
      where: { isActive: true },
      select: {
        id: true,
        service: true,
        price: true,
        extraHourPrice: true,
        djHours: true,
        maxGuests: true,
        soundWatts: true,
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

  const rows = packs.map((pack) => computePackPricingHealth(pack, config));
  const toUpdate = rows.filter((row) => row.hasAlert && row.recommendedPrice > 0);

  for (const row of toUpdate) {
    await prisma.pack.update({
      where: { id: row.packId },
      data: {
        price: row.recommendedPrice,
        extraHourPrice: row.recommendedExtraHourPrice,
      },
    });
  }

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'pricing',
      entityId: 'pack-auto-sync',
      details: {
        reviewed: rows.length,
        updated: toUpdate.length,
      },
    },
  });

  return {
    updated: toUpdate.length,
    reviewed: rows.length,
  };
}
