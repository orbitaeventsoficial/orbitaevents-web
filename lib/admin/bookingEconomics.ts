import { bookingOutstandingAmount } from '@/lib/payment-status';
import {
  aggregateServiceLines,
  computeBookingFinancialSummary,
  type ServiceLineLike,
} from '@/lib/services/costEngine';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';

export type DashboardNextEventEconomicsInput = {
  total: number;
  depositAmount?: number | null;
  remainingAmount?: number | null;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount?: number | null;
  extraHours?: number | null;
  travelCost?: number | null;
  distanceKm?: number | null;
  pack?: { price: number; extraHourPrice: number | null } | null;
  extras?: Array<{ price: number; quantity: number }> | null;
  serviceLines?: ServiceLineLike[] | null;
};

export type DashboardNextEventEconomics = {
  outstandingAmount: number;
  directCost: number;
  netMargin: number;
  marginPct: number;
};

export type DashboardEconomicRiskBookingInput = DashboardNextEventEconomicsInput & {
  id: string;
  reference: string;
  clientName: string;
  eventDate: Date;
};

export type DashboardEconomicRiskBooking = {
  id: string;
  reference: string;
  clientName: string;
  eventDate: Date;
  daysUntil: number;
  outstandingAmount: number;
  netMargin: number;
  marginPct: number;
};

export const DASHBOARD_ECONOMIC_RISK_WINDOW_DAYS = 7;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeDashboardNextEventEconomics(
  input: DashboardNextEventEconomicsInput,
  config: ProfitabilityConfig,
): DashboardNextEventEconomics {
  const extrasTotal = (input.extras ?? []).reduce((sum, extra) => (
    sum + (extra.price || 0) * (extra.quantity || 0)
  ), 0);
  const serviceLines = aggregateServiceLines(input.serviceLines ?? []);
  const summary = computeBookingFinancialSummary({
    total: input.total || 0,
    packPrice: input.pack?.price ?? 0,
    extrasTotal,
    extraHours: input.extraHours ?? 0,
    extraHourPrice: input.pack?.extraHourPrice ?? 0,
    distanceKm: input.distanceKm ?? 0,
    travelCost: input.travelCost ?? 0,
    serviceLinesRevenue: serviceLines.revenue,
    serviceLinesCost: serviceLines.cost,
    serviceLines: input.serviceLines ?? [],
  }, config);

  return {
    outstandingAmount: round2(bookingOutstandingAmount({
      total: input.total,
      depositAmount: input.depositAmount ?? 0,
      remainingAmount: input.remainingAmount,
      depositPaid: input.depositPaid,
      remainingPaid: input.remainingPaid,
      cashAmount: input.cashAmount,
    })),
    directCost: round2(summary.directCost),
    netMargin: round2(summary.netMargin),
    marginPct: Math.round(summary.marginPct),
  };
}

export function projectDashboardEconomicRiskBookings(
  rows: DashboardEconomicRiskBookingInput[],
  now: Date,
  config: ProfitabilityConfig,
  limit = 5,
): DashboardEconomicRiskBooking[] {
  return rows
    .map((row) => {
      const economics = computeDashboardNextEventEconomics(row, config);
      const diffMs = row.eventDate.getTime() - now.getTime();
      const daysUntil = Math.max(0, Math.ceil(diffMs / 86400000));
      return {
        id: row.id,
        reference: row.reference,
        clientName: row.clientName,
        eventDate: row.eventDate,
        daysUntil,
        outstandingAmount: economics.outstandingAmount,
        netMargin: economics.netMargin,
        marginPct: economics.marginPct,
      };
    })
    .filter((booking) => (
      booking.marginPct < 25
      || (booking.outstandingAmount > 0 && booking.daysUntil <= DASHBOARD_ECONOMIC_RISK_WINDOW_DAYS)
    ))
    .sort((a, b) => {
      const aCritical = a.marginPct < 25 || (a.outstandingAmount > 0 && a.daysUntil <= 1);
      const bCritical = b.marginPct < 25 || (b.outstandingAmount > 0 && b.daysUntil <= 1);
      if (aCritical !== bCritical) return aCritical ? -1 : 1;
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
      return a.marginPct - b.marginPct;
    })
    .slice(0, limit);
}
