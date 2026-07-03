export type ServiceLineCostRuleInput = {
  kind?: string | null;
  label?: string | null;
  costAmount?: number | null;
};

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
