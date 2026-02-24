/**
 * Utilitats de marge compartides
 * Semàfors de colors segons percentatge de marge
 */

export type MarginTone = {
  color: string;     // text color class
  bg: string;        // background class
  label: string;     // text descriptiu
  tone: 'emerald' | 'amber' | 'orange' | 'rose';
};

export function getMarginTone(pct: number): MarginTone {
  if (pct >= 50) return { color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/30', label: 'Excel·lent', tone: 'emerald' };
  if (pct >= 30) return { color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30', label: 'Acceptable', tone: 'amber' };
  if (pct >= 15) return { color: 'text-orange-300', bg: 'bg-orange-500/20 border-orange-500/30', label: 'Vigilar', tone: 'orange' };
  return { color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-500/30', label: 'Crític', tone: 'rose' };
}

/**
 * Calcula el percentatge de marge simplificat per a una reserva
 * Fórmula: directCost = packPrice×ratio + extrasTotal×ratio + fixedCost + travelCost
 * marginPct = ((total - directCost) / total) × 100
 */
export function calculateSimpleMarginPct(params: {
  total: number;
  packPrice: number;
  extrasTotal: number;
  packCostRatio: number;
  extraCostRatio: number;
  fixedOperationalCost: number;
  travelCost: number;
}): number {
  if (params.total <= 0) return 0;
  const directCost =
    params.packPrice * params.packCostRatio +
    params.extrasTotal * params.extraCostRatio +
    params.fixedOperationalCost +
    params.travelCost;
  return ((params.total - directCost) / params.total) * 100;
}
