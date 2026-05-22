export type ClientPortalPaymentBooking = {
  depositAmount: number;
  depositPaid: boolean;
  depositPaymentUrl?: string | null;
  remainingAmount: number;
  remainingPaid: boolean;
  remainingPaymentUrl?: string | null;
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

export function buildClientPortalPaymentsPath(locale: string, token: string): string {
  return `/${locale}/portal/${token}/payments`;
}

export function getClientPortalPaymentSummary(
  booking: ClientPortalPaymentBooking,
): ClientPortalPaymentSummary {
  const depositPaymentUrl = normalizePaymentUrl(booking.depositPaymentUrl);
  const remainingPaymentUrl = normalizePaymentUrl(booking.remainingPaymentUrl);
  const depositPayableOnline = !booking.depositPaid && booking.depositAmount > 0 && !!depositPaymentUrl;
  const remainingPayableOnline = booking.depositPaid && !booking.remainingPaid && booking.remainingAmount > 0 && !!remainingPaymentUrl;
  const nextPayment = depositPayableOnline ? 'deposit' : remainingPayableOnline ? 'remaining' : null;
  const depositOutstanding = booking.depositAmount > 0 && !booking.depositPaid;
  const remainingOutstanding = booking.remainingAmount > 0 && !booking.remainingPaid;

  let notice: ClientPortalPaymentSummary['notice'] = 'all_paid';
  if (depositPayableOnline) {
    notice = 'deposit_payable';
  } else if (remainingPayableOnline) {
    notice = 'remaining_payable';
  } else if (depositOutstanding || remainingOutstanding) {
    notice = booking.depositPaid && remainingOutstanding ? 'deposit_paid_remaining_pending' : 'manual_pending';
  }

  return {
    deposit: {
      amount: booking.depositAmount,
      paid: booking.depositPaid,
      paymentUrl: depositPaymentUrl,
      payableOnline: depositPayableOnline,
    },
    remaining: {
      amount: booking.remainingAmount,
      paid: booking.remainingPaid,
      paymentUrl: remainingPaymentUrl,
      payableOnline: remainingPayableOnline,
    },
    nextPayment,
    notice,
  };
}
