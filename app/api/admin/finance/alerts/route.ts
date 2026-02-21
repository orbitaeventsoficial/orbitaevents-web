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

  const [report, profitabilityConfig, marginTargetSetting, packPricingConfig, packPricingAlertsCount] = await Promise.all([
    buildProfitabilityReport(),
    getProfitabilityConfig(),
    prisma.setting.findUnique({ where: { key: 'pricing.pack.marginTargetPct' }, select: { value: true } }),
    getPackPricingModelConfigEditable(),
    getPackPricingAlertsCount(),
  ]);

  const lowMarginRiskCount = report.riskProfitability.length;
  const profitabilityCritical = isCriticalProfitabilityConfig(profitabilityConfig);
  const marginTargetRaw = Number(marginTargetSetting?.value);
  const missingMarginTarget = !Number.isFinite(marginTargetRaw) || marginTargetRaw <= 0;
  const packPricingCritical = (
    packPricingConfig.marginTargetPct <= 0 ||
    packPricingConfig.operatorCostPerHour <= 0 ||
    packPricingConfig.specialistCostPerHour <= 0 ||
    packPricingConfig.alertDivergencePct <= 0
  );

  const criticalCount = Number(profitabilityCritical) + Number(missingMarginTarget) + Number(packPricingCritical);
  const count = lowMarginRiskCount + criticalCount + packPricingAlertsCount;

  return NextResponse.json({
    ok: true,
    count,
    breakdown: {
      lowMarginRiskCount,
      packPricingAlertsCount,
      criticalCount,
    },
  });
}
