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

/**
 * Banda de salut del marge segons percentatge (0-100). FONT ÚNICA dels llindars
 * del semàfor de marge a tot l'admin. Qualsevol pantalla que pinti el marge
 * (fitxa de reserva, nova reserva, economia) ha de derivar d'aquí per no divergir.
 *   ≥50 excellent · ≥30 acceptable · ≥15 watch · <15 critical
 */
export type MarginBand = 'excellent' | 'acceptable' | 'watch' | 'critical';
export type MarginProfile = 'own' | 'external';

const MARGIN_THRESHOLDS: Record<MarginProfile, { excellent: number; acceptable: number; watch: number }> = {
  own: { excellent: 50, acceptable: 30, watch: 15 },
  // Revenda / proveidor extern: el cost principal ja surt de caixa cap al partner.
  external: { excellent: 25, acceptable: 10, watch: 5 },
};

export function getMarginBand(pct: number, profile: MarginProfile = 'own'): MarginBand {
  const thresholds = MARGIN_THRESHOLDS[profile] ?? MARGIN_THRESHOLDS.own;
  if (pct >= thresholds.excellent) return 'excellent';
  if (pct >= thresholds.acceptable) return 'acceptable';
  if (pct >= thresholds.watch) return 'watch';
  return 'critical';
}

export function getMarginTone(pct: number, profile: MarginProfile = 'own'): MarginTone {
  switch (getMarginBand(pct, profile)) {
    case 'excellent': return { color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/30', label: 'Excel·lent', tone: 'emerald' };
    case 'acceptable': return { color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30', label: 'Acceptable', tone: 'amber' };
    case 'watch': return { color: 'text-orange-300', bg: 'bg-orange-500/20 border-orange-500/30', label: 'Vigilar', tone: 'orange' };
    case 'critical': return { color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-500/30', label: 'Crític', tone: 'rose' };
  }
}

/** Etiqueta textual canònica de la banda de marge. */
const MARGIN_LABEL: Record<MarginBand, string> = {
  excellent: 'Excel·lent',
  acceptable: 'Acceptable',
  watch: 'Vigilar',
  critical: 'Crític',
};
export function getMarginLabel(pct: number, profile: MarginProfile = 'own'): string {
  return MARGIN_LABEL[getMarginBand(pct, profile)];
}

/**
 * Classes canòniques admin (tokens) per al semàfor de marge de 4 bandes.
 * Definides a admin-shell.css (.o-margin-text--* / .o-margin-bar--*).
 */
export function getMarginTextClass(pct: number, profile: MarginProfile = 'own'): string {
  return `o-margin-text--${getMarginBand(pct, profile)}`;
}
export function getMarginBarClass(pct: number, profile: MarginProfile = 'own'): string {
  return `o-margin-bar--${getMarginBand(pct, profile)}`;
}

export type TravelMarginTone = {
  color: string;
  border: string;
  bg: string;
  tone: 'emerald' | 'orange' | 'rose';
};

/**
 * Semàfor de marge de transport.
 * ≥45% → sa (emerald), ≥20% → vigilar (orange), <20% → crític (rose)
 */
export function getTravelMarginTone(pct: number): TravelMarginTone {
  if (pct >= 45) return { color: 'text-emerald-300', border: 'border-emerald-400/30', bg: 'bg-emerald-950/20', tone: 'emerald' };
  if (pct >= 20) return { color: 'text-orange-300', border: 'border-orange-400/30', bg: 'bg-orange-950/20', tone: 'orange' };
  return { color: 'text-rose-300', border: 'border-rose-400/30', bg: 'bg-rose-950/20', tone: 'rose' };
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
