/**
 * Tipus i helpers purs per a la pàgina d'Economia.
 * Extret de EconomiaClient.tsx per reduir la mida del component.
 */

import { formatCurrency } from '@/lib/constants';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';
import type { PackPricingModelConfig } from '@/lib/services/packPricingHealth';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Tab = 'resum' | 'cobraments' | 'rendibilitat' | 'tresoreria' | 'previsions' | 'config';

export interface PaymentRow {
  id: string;
  reference: string;
  status: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  total: number;
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt: string | null;
  remainingAmount: number;
  remainingPaid: boolean;
  remainingPaidAt: string | null;
  depositDueAt: string;
  remainingDueAt: string;
  overdueDeposit: boolean;
  overdueRemaining: boolean;
  dueSoonDeposit: boolean;
  dueSoonRemaining: boolean;
  paymentFlowState: string;
}

export interface ProfitabilityRow {
  id: string;
  reference: string;
  clientName: string;
  eventDate: string;
  source: string;
  netMargin: number;
  marginPct: number;
  travelCost: number;
}

export interface BySourceRow {
  source: string;
  bookings: number;
  revenue: number;
  netMargin: number;
  avgMarginPct: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  role: string;
  before: ProfitabilityConfig;
  after: ProfitabilityConfig;
}

export interface PackPricingRow {
  id: string;
  name: string;
  slug: string;
  service: string;
  price: number;
  recommendedPrice: number;
  directCost: number;
  profit: number;
  marginPct: number;
  extraHourPrice: number;
  recommendedExtraHourPrice: number;
  extraHourCostEstimated: number;
  extraHourProfit: number;
  extraHourMarginPct: number;
  divergencePct: number;
  extraHourDivergencePct: number;
  hasAlert: boolean;
}

export interface CashFlowMonth {
  month: string;
  income: number;
  costs: number;
  netFlow: number;
  cumulative: number;
}

export interface ForecastMonth {
  month: string;
  historicalAvg: number;
  pipeline: number;
  combined: number;
}

export interface CacChannelRow {
  channel: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  estimatedCac: number;
  realCac: number | null;
}

export interface VehicleConfig {
  fuelPricePerLiter: number;
  consumptionL100: number;
  maintenanceCostPerKm: number;
  effectiveCostPerKm: number;
  updatedAt: string | null;
}

export interface EconomiaClientProps {
  outstandingTotal: number;
  overdueTotal: number;
  dueSoonTotal: number;
  monthCollected: number;
  atRiskRows: PaymentRow[];
  upcomingDueRows: PaymentRow[];
  allPaymentRows?: PaymentRow[];
  hasReport: boolean;
  reportError: boolean;
  realized: { revenue: number; netMargin: number; avgMarginPct: number; bookings: number };
  forecast: { revenue: number; netMargin: number; avgMarginPct: number; bookings: number };
  topProfitability: ProfitabilityRow[];
  riskProfitability: ProfitabilityRow[];
  bySource: BySourceRow[];
  config: ProfitabilityConfig;
  packPricingConfig: PackPricingModelConfig;
  packPricingRows: PackPricingRow[];
  packPricingSummary: {
    healthy: number;
    warning: number;
    critical: number;
  };
  packPricingHistoryEntries: Array<{
    id: string;
    createdAt: string;
    role: string;
    before: PackPricingModelConfig;
    after: PackPricingModelConfig;
  }>;
  historyEntries: HistoryEntry[];
  inventoryValue: number;
  inventoryCount: number;
  cashFlow?: CashFlowMonth[];
  forecast_pipeline?: ForecastMonth[];
  vehicleConfig?: VehicleConfig;
  cacByChannel?: CacChannelRow[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const money = formatCurrency;

export function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function marginColor(pctValue: number): string {
  const p = pctValue * 100;
  if (p >= 50) return 'text-emerald-400';
  if (p >= 30) return 'text-amber-300';
  if (p >= 15) return 'text-orange-400';
  return 'text-rose-400';
}

export function marginBg(pctValue: number): string {
  const p = pctValue * 100;
  if (p >= 50) return 'bg-emerald-500';
  if (p >= 30) return 'bg-amber-500';
  if (p >= 15) return 'bg-orange-500';
  return 'bg-rose-500';
}

export function paymentStateBadge(paid: boolean) {
  return paid
    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
    : 'border-rose-500/40 bg-rose-500/15 text-rose-200';
}

export function packMarginBadge(marginPct: number, targetMarginPct: number) {
  if (marginPct >= targetMarginPct) {
    return {
      label: 'Sa',
      cls: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
      dot: 'bg-emerald-400',
    };
  }
  if (marginPct >= (targetMarginPct - 0.08)) {
    return {
      label: 'Vigilar',
      cls: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
      dot: 'bg-amber-400',
    };
  }
  return {
    label: 'Crític',
    cls: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
    dot: 'bg-rose-400',
  };
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

export const TABS: { id: Tab; label: string; icon: string; mobileLabel: string }[] = [
  { id: 'resum', label: 'Resum general', icon: '📊', mobileLabel: 'Resum' },
  { id: 'cobraments', label: 'Cobraments', icon: '💶', mobileLabel: 'Cobrar' },
  { id: 'rendibilitat', label: 'Rendibilitat', icon: '📈', mobileLabel: 'Marge' },
  { id: 'tresoreria', label: 'Tresoreria', icon: '💰', mobileLabel: 'Caixa' },
  { id: 'previsions', label: 'Previsions', icon: '🔮', mobileLabel: 'Previsió' },
  { id: 'config', label: 'Configuració', icon: '⚙️', mobileLabel: 'Config' },
];

export type { ProfitabilityConfig, PackPricingModelConfig };
