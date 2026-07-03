export type ServiceLineCostRuleInput = {
  kind?: string | null;
  label?: string | null;
  costAmount?: number | null;
  revenueAmount?: number | null;
  quantity?: number | null;
  collaboratorId?: string | null;
};

export const SUBCONTRACTED_MARKUP_TARGET_PCT = 20;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isIncludedSoundTechSettlementLine(line: ServiceLineCostRuleInput): boolean {
  const label = normalizeText(line.label);
  return line.kind === 'SOUND_TECH' && label.includes('tecnic de so') && label.includes('incl');
}

export function sanitizeRevenueAmount(value?: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, roundMoney(value));
}

export function sanitizeServiceLineCostAmount(line: ServiceLineCostRuleInput): number | null {
  const value = line.costAmount;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = roundMoney(value);
  if (rounded < 0) return isIncludedSoundTechSettlementLine(line) ? rounded : 0;
  return rounded;
}

export type SubcontractedMarkupSummary = {
  revenue: number;
  cost: number;
  markupAmount: number;
  markupPct: number;
  targetPct: number;
  ok: boolean;
  orbitaTechIncome: number;
};

export function computeSubcontractedMarkupSummary(lines: ServiceLineCostRuleInput[]): SubcontractedMarkupSummary {
  let revenue = 0;
  let cost = 0;
  let orbitaTechIncome = 0;

  for (const line of lines) {
    const qty = typeof line.quantity === 'number' && Number.isFinite(line.quantity) && line.quantity > 0
      ? line.quantity
      : 1;
    const lineCost = (line.costAmount ?? 0) * qty;
    if (lineCost < 0 && isIncludedSoundTechSettlementLine(line)) {
      orbitaTechIncome += Math.abs(lineCost);
      continue;
    }
    if (line.kind !== 'PROVIDER_SERVICE' || !line.collaboratorId) continue;
    const providerCost = lineCost;
    const clientRevenue = (line.revenueAmount ?? 0) * qty;
    if (providerCost <= 0 || clientRevenue <= 0) continue;
    cost += providerCost;
    revenue += clientRevenue;
  }

  const markupAmount = roundMoney(revenue - cost);
  const markupPct = cost > 0 ? roundMoney((markupAmount / cost) * 100) : 0;
  return {
    revenue: roundMoney(revenue),
    cost: roundMoney(cost),
    markupAmount,
    markupPct,
    targetPct: SUBCONTRACTED_MARKUP_TARGET_PCT,
    ok: cost <= 0 || markupPct >= SUBCONTRACTED_MARKUP_TARGET_PCT,
    orbitaTechIncome: roundMoney(orbitaTechIncome),
  };
}
