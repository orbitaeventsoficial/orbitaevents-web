import { ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS } from '@/lib/constants/admin';
import { bookingOutstandingBreakdown } from '@/lib/payment-status';
import type { PaymentRow } from './economia-types';

export type EconomiaPaymentBookingInput = {
  id: string;
  reference: string;
  status: string;
  clientName: string;
  clientPhone: string;
  eventDate: Date;
  total: number;
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt: Date | null;
  remainingAmount: number;
  remainingPaid: boolean;
  remainingPaidAt: Date | null;
  cashAmount: number | null;
};

export type BuildEconomiaPaymentRowOptions = {
  now: Date;
  paymentFlowState: string;
  dueSoonDays?: number;
};

export type EconomiaPaymentSummary = {
  outstandingTotal: number;
  overdueTotal: number;
  dueSoonTotal: number;
  monthCollected: number;
  atRiskRows: PaymentRow[];
  upcomingDueRows: PaymentRow[];
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function byEventDate(a: PaymentRow, b: PaymentRow) {
  return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
}

export function buildEconomiaPaymentRow(
  booking: EconomiaPaymentBookingInput,
  options: BuildEconomiaPaymentRowOptions,
): PaymentRow {
  const dueSoonDays = options.dueSoonDays ?? ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS;
  const depositDueAt = addDays(new Date(booking.eventDate), -30);
  const remainingDueAt = addDays(new Date(booking.eventDate), -dueSoonDays);
  const weekAhead = addDays(options.now, dueSoonDays);
  const breakdown = bookingOutstandingBreakdown({
    total: booking.total,
    depositAmount: booking.depositAmount,
    remainingAmount: booking.remainingAmount,
    depositPaid: booking.depositPaid,
    remainingPaid: booking.remainingPaid,
    cashAmount: booking.cashAmount,
  });
  const depositOutstandingAmount = breakdown.depositAmount;
  const remainingOutstandingAmount = breakdown.remainingAmount;
  const outstandingAmount = breakdown.total;
  const depositSettled = depositOutstandingAmount <= 0;
  const remainingSettled = remainingOutstandingAmount <= 0;
  const overdueDeposit = depositOutstandingAmount > 0 && depositDueAt < options.now;
  const overdueRemaining = remainingOutstandingAmount > 0 && remainingDueAt < options.now;
  const dueSoonDeposit = depositOutstandingAmount > 0 && depositDueAt >= options.now && depositDueAt <= weekAhead;
  const dueSoonRemaining = remainingOutstandingAmount > 0 && remainingDueAt >= options.now && remainingDueAt <= weekAhead;

  return {
    ...booking,
    eventDate: booking.eventDate.toISOString(),
    depositPaidAt: booking.depositPaidAt?.toISOString() ?? null,
    remainingPaidAt: booking.remainingPaidAt?.toISOString() ?? null,
    depositDueAt: depositDueAt.toISOString(),
    remainingDueAt: remainingDueAt.toISOString(),
    cashAmount: booking.cashAmount,
    depositOutstandingAmount,
    remainingOutstandingAmount,
    outstandingAmount,
    depositSettled,
    remainingSettled,
    overdueDeposit,
    overdueRemaining,
    dueSoonDeposit,
    dueSoonRemaining,
    paymentFlowState: options.paymentFlowState,
  };
}

export function summarizeEconomiaPaymentRows(rows: PaymentRow[], monthStart: Date): EconomiaPaymentSummary {
  const outstandingTotal = rows.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const overdueTotal = rows.reduce((sum, row) => {
    return sum
      + (row.overdueDeposit ? row.depositOutstandingAmount : 0)
      + (row.overdueRemaining ? row.remainingOutstandingAmount : 0);
  }, 0);
  const dueSoonTotal = rows.reduce((sum, row) => {
    return sum
      + (row.dueSoonDeposit ? row.depositOutstandingAmount : 0)
      + (row.dueSoonRemaining ? row.remainingOutstandingAmount : 0);
  }, 0);
  const monthCollected = rows.reduce((sum, row) => {
    const depositCollected = row.depositPaidAt && new Date(row.depositPaidAt) >= monthStart ? row.depositAmount : 0;
    const remainingCollected = row.remainingPaidAt && new Date(row.remainingPaidAt) >= monthStart ? row.remainingAmount : 0;
    return sum + depositCollected + remainingCollected;
  }, 0);

  return {
    outstandingTotal: roundMoney(outstandingTotal),
    overdueTotal: roundMoney(overdueTotal),
    dueSoonTotal: roundMoney(dueSoonTotal),
    monthCollected: roundMoney(monthCollected),
    atRiskRows: rows
      .filter((row) => row.overdueDeposit || row.overdueRemaining)
      .sort(byEventDate)
      .slice(0, 30),
    upcomingDueRows: rows
      .filter((row) => row.dueSoonDeposit || row.dueSoonRemaining)
      .sort(byEventDate)
      .slice(0, 30),
  };
}
