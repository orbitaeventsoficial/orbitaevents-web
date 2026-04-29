import {
  DATE_PRICING_RULES,
  type DatePricingRule,
} from '@/lib/constants/pricingRules';

export type DatePricingLocale = 'ca' | 'es' | 'en';

export type DatePricingResult = {
  basePrice: number;
  finalPrice: number;
  surchargeEur: number;
  surchargePct: number;
  appliedRule: {
    id: string;
    multiplier: number;
    label: string;
  } | null;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function ruleMatches(rule: DatePricingRule, date: Date): boolean {
  if (rule.kind === 'recurring-weekday') {
    return rule.weekdays.includes(date.getDay());
  }
  if (rule.kind === 'fixed-date') {
    return date.getMonth() + 1 === rule.month && date.getDate() === rule.day;
  }
  // date-range — handle wrap-around (Christmas: Dec 15 → Jan 6)
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const startKey = rule.startMonth * 100 + rule.startDay;
  const endKey = rule.endMonth * 100 + rule.endDay;
  const dateKey = month * 100 + day;
  if (startKey <= endKey) {
    return dateKey >= startKey && dateKey <= endKey;
  }
  // wraps year boundary
  return dateKey >= startKey || dateKey <= endKey;
}

/**
 * Selecciona la regla amb multiplicador més alt; tie-break per priority.
 */
export function findApplicableRule(
  date: Date,
  rules: DatePricingRule[] = DATE_PRICING_RULES,
): DatePricingRule | null {
  const candidates = rules.filter((rule) => ruleMatches(rule, date));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) => {
    if (current.multiplier > best.multiplier) return current;
    if (current.multiplier === best.multiplier && current.priority > best.priority) return current;
    return best;
  });
}

export function applyDatePricing(
  basePrice: number,
  eventDate: Date | string | null | undefined,
  locale: DatePricingLocale = 'ca',
  rules: DatePricingRule[] = DATE_PRICING_RULES,
): DatePricingResult {
  const safeBase = Number.isFinite(basePrice) && basePrice >= 0 ? basePrice : 0;
  if (!eventDate) {
    return {
      basePrice: round2(safeBase),
      finalPrice: round2(safeBase),
      surchargeEur: 0,
      surchargePct: 0,
      appliedRule: null,
    };
  }

  const date = eventDate instanceof Date ? eventDate : new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return {
      basePrice: round2(safeBase),
      finalPrice: round2(safeBase),
      surchargeEur: 0,
      surchargePct: 0,
      appliedRule: null,
    };
  }

  const applied = findApplicableRule(date, rules);
  if (!applied) {
    return {
      basePrice: round2(safeBase),
      finalPrice: round2(safeBase),
      surchargeEur: 0,
      surchargePct: 0,
      appliedRule: null,
    };
  }

  const finalPrice = round2(safeBase * applied.multiplier);
  const surchargeEur = round2(finalPrice - safeBase);
  const surchargePct = round2((applied.multiplier - 1) * 100);

  return {
    basePrice: round2(safeBase),
    finalPrice,
    surchargeEur,
    surchargePct,
    appliedRule: {
      id: applied.id,
      multiplier: applied.multiplier,
      label: applied.label[locale],
    },
  };
}
