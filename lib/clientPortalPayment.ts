import { bookingOutstandingBreakdown } from '@/lib/payment-status';

export type ClientPortalPaymentBooking = {
  total?: number | null;
  depositAmount: number;
  depositPaid: boolean;
  depositPaymentUrl?: string | null;
  remainingAmount: number;
  remainingPaid: boolean;
  remainingPaymentUrl?: string | null;
  cashAmount?: number | null;
};

export type ClientPortalPaymentSummary = {
  deposit: {
    amount: number;
    paid: boolean;
    paymentUrl: string | null;
    payableOnline: boolean;
  };
  remaining: {
    amount: number;
    paid: boolean;
    paymentUrl: string | null;
    payableOnline: boolean;
  };
  nextPayment: 'deposit' | 'remaining' | null;
  notice: 'deposit_payable' | 'remaining_payable' | 'deposit_paid_remaining_pending' | 'manual_pending' | 'all_paid';
};

function normalizePaymentUrl(url: string | null | undefined): string | null {
  const value = url?.trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

function amountsMatch(left: number, right: number): boolean {
  return Math.round(left * 100) === Math.round(right * 100);
}

export function buildClientPortalPaymentsPath(locale: string, token: string): string {
  return `/${locale}/portal/${token}/payments`;
}

export function getClientPortalPaymentSummary(
  booking: ClientPortalPaymentBooking,
): ClientPortalPaymentSummary {
  const depositPaymentUrl = normalizePaymentUrl(booking.depositPaymentUrl);
  const remainingPaymentUrl = normalizePaymentUrl(booking.remainingPaymentUrl);
  const breakdown = bookingOutstandingBreakdown({
    total: booking.total ?? booking.depositAmount + booking.remainingAmount,
    depositAmount: booking.depositAmount,
    remainingAmount: booking.remainingAmount,
    depositPaid: booking.depositPaid,
    remainingPaid: booking.remainingPaid,
    cashAmount: booking.cashAmount,
  });
  const depositSettled = breakdown.depositAmount <= 0;
  const remainingSettled = breakdown.remainingAmount <= 0;
  const depositAmount = depositSettled ? booking.depositAmount : breakdown.depositAmount;
  const remainingAmount = remainingSettled ? booking.remainingAmount : breakdown.remainingAmount;
  const depositLinkMatchesPendingAmount = amountsMatch(breakdown.depositAmount, booking.depositAmount);
  const remainingLinkMatchesPendingAmount = amountsMatch(breakdown.remainingAmount, booking.remainingAmount);
  const depositPayableOnline = !depositSettled && depositAmount > 0 && depositLinkMatchesPendingAmount && !!depositPaymentUrl;
  const remainingPayableOnline = depositSettled && !remainingSettled && remainingAmount > 0 && remainingLinkMatchesPendingAmount && !!remainingPaymentUrl;
  const nextPayment = depositPayableOnline ? 'deposit' : remainingPayableOnline ? 'remaining' : null;
  const depositOutstanding = breakdown.depositAmount > 0;
  const remainingOutstanding = breakdown.remainingAmount > 0;

  let notice: ClientPortalPaymentSummary['notice'] = 'all_paid';
  if (depositPayableOnline) {
    notice = 'deposit_payable';
  } else if (remainingPayableOnline) {
    notice = 'remaining_payable';
  } else if (depositOutstanding || remainingOutstanding) {
    notice = depositSettled && remainingOutstanding ? 'deposit_paid_remaining_pending' : 'manual_pending';
  }

  return {
    deposit: {
      amount: depositAmount,
      paid: depositSettled,
      paymentUrl: depositPaymentUrl,
      payableOnline: depositPayableOnline,
    },
    remaining: {
      amount: remainingAmount,
      paid: remainingSettled,
      paymentUrl: remainingPaymentUrl,
      payableOnline: remainingPayableOnline,
    },
    nextPayment,
    notice,
  };
}
