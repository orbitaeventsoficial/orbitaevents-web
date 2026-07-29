import { prisma } from '@/lib/prisma';
import { buildProfitabilityReport, getProfitabilityConfig } from '@/lib/services/profitabilityService';
import { getPackPricingAlertsCount, getPackPricingModelConfigEditable } from '@/lib/services/packPricingHealth';

function isCriticalProfitabilityConfig(config: Awaited<ReturnType<typeof getProfitabilityConfig>>): boolean {
  return (
    config.packCostRatio <= 0 ||
    config.extraCostRatio <= 0 ||
    config.extraHourCostRatio <= 0 ||
    config.fixedOperationalCost <= 0
  );
}

function sanitizeAlertCount(value?: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

export async function getFinanceAlertsSummary() {
  const [
    reportResult,
    profitabilityConfigResult,
    marginTargetSetting,
    packPricingConfigResult,
    packPricingAlertsCountResult,
    autofixFailureAlertSetting,
    systemAutofixFailureAlertSetting,
  ] = await Promise.all([
    buildProfitabilityReport().catch(() => null),
    getProfitabilityConfig().catch(() => null),
    prisma.setting.findUnique({ where: { key: 'pricing.pack.marginTargetPct' }, select: { value: true } }),
    getPackPricingModelConfigEditable().catch(() => null),
    getPackPricingAlertsCount().catch(() => 0),
    prisma.setting.findUnique({ where: { key: 'alerts.finance.autofixFailureCount' }, select: { value: true } }),
    prisma.setting.findUnique({ where: { key: 'alerts.system.autofixFailureCount' }, select: { value: true } }),
  ]);

  const report = reportResult;
  const profitabilityConfig = profitabilityConfigResult;
  const packPricingConfig = packPricingConfigResult;
  const packPricingAlertsCount = packPricingAlertsCountResult;
  const lowMarginRiskCount = report?.riskProfitability?.length ?? 1;
  const profitabilityCritical = profitabilityConfig ? isCriticalProfitabilityConfig(profitabilityConfig) : true;
  const marginTargetRaw = Number(marginTargetSetting?.value);
  const missingMarginTarget = !Number.isFinite(marginTargetRaw) || marginTargetRaw <= 0;
  const packPricingCritical = !packPricingConfig || (
    packPricingConfig.marginTargetPct <= 0 ||
    packPricingConfig.operatorCostPerHour <= 0 ||
    packPricingConfig.specialistCostPerHour <= 0 ||
    packPricingConfig.alertDivergencePct <= 0
  );
  const autofixFailureCount = sanitizeAlertCount(autofixFailureAlertSetting?.value);
  const systemAutofixFailureCount = sanitizeAlertCount(systemAutofixFailureAlertSetting?.value);

  const criticalCount = Number(profitabilityCritical) + Number(missingMarginTarget) + Number(packPricingCritical);
  const count = lowMarginRiskCount + criticalCount + packPricingAlertsCount + autofixFailureCount + systemAutofixFailureCount;

  return {
    ok: true as const,
    count,
    breakdown: {
      lowMarginRiskCount,
      packPricingAlertsCount,
      criticalCount,
      autofixFailureCount,
      systemAutofixFailureCount,
    },
  };
}
