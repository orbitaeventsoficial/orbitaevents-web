import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { buildProfitabilityReport, getProfitabilityConfig } from '@/lib/services/profitabilityService';
import { prisma } from '@/lib/prisma';
import { getPackPricingAlertsCount, getPackPricingModelConfigEditable } from '@/lib/services/packPricingHealth';

export const dynamic = 'force-dynamic';

function isCriticalProfitabilityConfig(config: Awaited<ReturnType<typeof getProfitabilityConfig>>): boolean {
  return (
    config.packCostRatio <= 0 ||
    config.extraCostRatio <= 0 ||
    config.extraHourCostRatio <= 0 ||
    config.fixedOperationalCost <= 0
  );
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

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
  const autofixFailureCount = Number(autofixFailureAlertSetting?.value || '0') || 0;
  const systemAutofixFailureCount = Number(systemAutofixFailureAlertSetting?.value || '0') || 0;

  const criticalCount = Number(profitabilityCritical) + Number(missingMarginTarget) + Number(packPricingCritical);
  const count = lowMarginRiskCount + criticalCount + packPricingAlertsCount + autofixFailureCount + systemAutofixFailureCount;

  return NextResponse.json({
    ok: true,
    count,
    breakdown: {
      lowMarginRiskCount,
      packPricingAlertsCount,
      criticalCount,
      autofixFailureCount,
      systemAutofixFailureCount,
    },
  });
}
