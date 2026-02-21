import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { buildProfitabilityReport, getProfitabilityConfig } from '@/lib/services/profitabilityService';
import { prisma } from '@/lib/prisma';

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

  const [report, profitabilityConfig, marginTargetSetting] = await Promise.all([
    buildProfitabilityReport(),
    getProfitabilityConfig(),
    prisma.setting.findUnique({ where: { key: 'pricing.pack.marginTargetPct' }, select: { value: true } }),
  ]);

  const lowMarginRiskCount = report.riskProfitability.length;
  const profitabilityCritical = isCriticalProfitabilityConfig(profitabilityConfig);
  const marginTargetRaw = Number(marginTargetSetting?.value);
  const missingMarginTarget = !Number.isFinite(marginTargetRaw) || marginTargetRaw <= 0;

  const criticalCount = Number(profitabilityCritical) + Number(missingMarginTarget);
  const count = lowMarginRiskCount + criticalCount;

  return NextResponse.json({
    ok: true,
    count,
    breakdown: {
      lowMarginRiskCount,
      criticalCount,
    },
  });
}

