/**
 * pricingConfigService — Llegeix i escriu PricingConfig de BD amb fallback canònic.
 * Si la BD no té cap fila o un camp és null, s'usa pricing-intelligence.ts.
 * Mai llança excepció visible: qualsevol error de BD retorna fallback pur.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  PRICING_INTELLIGENCE,
  SERVICE_HOURLY_RATES,
  EQUIPMENT_AMORTIZATION,
  resolveServicePricingKey,
  type ServicePricingResolutionInput,
  type ServicePricingKey,
} from '@/lib/constants/pricing-intelligence';

export interface EffectivePricingConfig {
  serviceKey: ServicePricingKey;
  rate: { min: number; recommended: number; premium: number };
  targetMarginPct: number;
  depositPctRecommended: number;
  alertThresholds: {
    priceDeviationAlertPct: number;
    priceDeviationCriticalPct: number;
    lowMarginPct: number;
    criticalMarginPct: number;
  };
  equipmentAmortization: Record<string, { value: number; lifeHours: number }>;
  source: 'db' | 'fallback';
}

export async function getEffectivePricingConfig(
  bookingServiceType: string | ServicePricingResolutionInput | null | undefined,
): Promise<EffectivePricingConfig> {
  const serviceKey = resolveServicePricingKey(bookingServiceType);
  const fallbackRate = SERVICE_HOURLY_RATES[serviceKey];
  const m = PRICING_INTELLIGENCE.margin;
  const dev = PRICING_INTELLIGENCE.priceDeviation;

  let row: { ourHourlyRateByService: unknown; targetMarginPct: number | null;
    depositPctRecommended: number | null; alertThresholds: unknown;
    equipmentAmortization: unknown } | null = null;
  try {
    row = await prisma.pricingConfig.findUnique({ where: { id: 'default' } });
  } catch (error) {
    console.error('[pricingConfig] lectura BD fallida, ús de fallback:', error);
  }

  const ratesByService = (row?.ourHourlyRateByService ?? {}) as
    Record<string, Partial<{ min: number; recommended: number; premium: number }>>;
  const dbRate = ratesByService[serviceKey] ?? {};
  const th = (row?.alertThresholds ?? {}) as Partial<EffectivePricingConfig['alertThresholds']>;

  return {
    serviceKey,
    rate: {
      min: dbRate.min ?? fallbackRate.min,
      recommended: dbRate.recommended ?? fallbackRate.recommended,
      premium: dbRate.premium ?? fallbackRate.premium,
    },
    targetMarginPct: row?.targetMarginPct ?? m.TARGET_MARGIN_PCT,
    depositPctRecommended:
      row?.depositPctRecommended ?? PRICING_INTELLIGENCE.business.DEPOSIT_PCT_RECOMMENDED,
    alertThresholds: {
      priceDeviationAlertPct: th.priceDeviationAlertPct ?? dev.ALERT_PCT,
      priceDeviationCriticalPct: th.priceDeviationCriticalPct ?? dev.CRITICAL_PCT,
      lowMarginPct: th.lowMarginPct ?? m.LOW_MARGIN_PCT,
      criticalMarginPct: th.criticalMarginPct ?? m.CRITICAL_MARGIN_PCT,
    },
    equipmentAmortization:
      (row?.equipmentAmortization as typeof EQUIPMENT_AMORTIZATION) ?? EQUIPMENT_AMORTIZATION,
    source: row ? 'db' : 'fallback',
  };
}

export interface PricingConfigInput {
  targetMarginPct?: number;
  ourHourlyRateByService?: Record<string, { min: number; recommended: number; premium: number }>;
  depositPctRecommended?: number;
  alertThresholds?: { priceDeviationAlertPct?: number; priceDeviationCriticalPct?: number; lowMarginPct?: number; criticalMarginPct?: number };
  equipmentAmortization?: Record<string, { value: number; lifeHours: number }> | null;
}

export async function upsertPricingConfig(input: PricingConfigInput) {
  const data = {
    ...(input.targetMarginPct !== undefined && { targetMarginPct: input.targetMarginPct }),
    ...(input.ourHourlyRateByService !== undefined && { ourHourlyRateByService: input.ourHourlyRateByService as Prisma.InputJsonValue }),
    ...(input.depositPctRecommended !== undefined && { depositPctRecommended: input.depositPctRecommended }),
    ...(input.alertThresholds !== undefined && { alertThresholds: input.alertThresholds as Prisma.InputJsonValue }),
    ...(input.equipmentAmortization !== undefined && {
      equipmentAmortization: input.equipmentAmortization
        ? input.equipmentAmortization as Prisma.InputJsonValue
        : Prisma.DbNull,
    }),
  };
  return prisma.pricingConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  });
}
