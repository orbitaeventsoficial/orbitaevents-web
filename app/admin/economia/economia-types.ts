/**
 * Tipus i helpers purs per a la pàgina d'Economia.
 * Extret de EconomiaClient.tsx per reduir la mida del component.
 */

import { formatCurrency } from '@/lib/constants';
import { getMarginTextClass, getMarginBarClass } from '@/lib/margin-utils';
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
  cashAmount: number | null;
  depositOutstandingAmount: number;
  remainingOutstandingAmount: number;
  outstandingAmount: number;
  depositSettled: boolean;
  remainingSettled: boolean;
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
  pipelineLow: number;
  pipelineHigh: number;
  combined: number;
  combinedLow: number;
  combinedHigh: number;
  previousYearActual: number;
  confirmedBookings: number;
  confirmedRevenue: number;
}

export interface CacChannelRow {
  channel: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  estimatedCac: number;
  realSpend: number | null;
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

// Semàfor de marge canònic (4 bandes: Excel·lent/Acceptable/Vigilar/Crític),
// font única getMarginBand. pctValue és fracció (0-1) → percent.
export function marginColor(pctValue: number): string {
  return getMarginTextClass(pctValue * 100);
}

export function marginBg(pctValue: number): string {
  return getMarginBarClass(pctValue * 100);
}

export function paymentStateBadge(settled: boolean) {
  return settled
    ? 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
    : 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger';
}

export function packMarginBadge(marginPct: number, targetMarginPct: number) {
  if (marginPct >= targetMarginPct) {
    return {
      label: 'Sa',
      cls: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
      dot: 'admin-tone-bg-success',
    };
  }
  if (marginPct >= (targetMarginPct - 0.08)) {
    return {
      label: 'Vigilar',
      cls: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
      dot: 'admin-tone-bg-warning',
    };
  }
  return {
    label: 'Crític',
    cls: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
    dot: 'admin-tone-bg-danger',
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
