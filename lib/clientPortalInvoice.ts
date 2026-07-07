import {
  getClientPortalPaymentSummary,
  type ClientPortalPaymentSummary,
} from '@/lib/clientPortalPayment';

export type ClientPortalInvoiceBooking = {
  total?: number | null;
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt: Date | null;
  depositPaymentUrl?: string | null;
  remainingAmount: number;
  remainingPaid: boolean;
  remainingPaidAt: Date | null;
  remainingPaymentUrl?: string | null;
  cashAmount?: number | null;
};

export type ClientPortalInvoiceProposal = {
  reference: string;
  pdfUrl: string | null;
};

export type ClientPortalInvoiceSummary = {
  proposalReference: string | null;
  pdfUrl: string | null;
  total: number;
  deposit: { amount: number; paid: boolean; paidAt: Date | null; paymentUrl: string | null; payableOnline: boolean };
  remaining: { amount: number; paid: boolean; paidAt: Date | null; paymentUrl: string | null; payableOnline: boolean };
  nextPayment: ClientPortalPaymentSummary['nextPayment'];
  paymentNotice: ClientPortalPaymentSummary['notice'];
  allPaid: boolean;
};

export function buildClientPortalInvoicePath(locale: string, token: string): string {
  return `/${locale}/portal/${token}/invoice`;
}

export function getClientPortalInvoiceSummary(
  booking: ClientPortalInvoiceBooking,
  proposals: ClientPortalInvoiceProposal[],
): ClientPortalInvoiceSummary {
  const latestWithPdf = proposals.find((p) => !!p.pdfUrl) ?? proposals[0] ?? null;
  const paymentSummary = getClientPortalPaymentSummary(booking);
  return {
    proposalReference: latestWithPdf?.reference ?? null,
    pdfUrl: latestWithPdf?.pdfUrl ?? null,
    total: booking.total ?? booking.depositAmount + booking.remainingAmount,
    deposit: {
      amount: paymentSummary.deposit.amount,
      paid: paymentSummary.deposit.paid,
      paidAt: booking.depositPaidAt,
      paymentUrl: paymentSummary.deposit.paymentUrl,
      payableOnline: paymentSummary.deposit.payableOnline,
    },
    remaining: {
      amount: paymentSummary.remaining.amount,
      paid: paymentSummary.remaining.paid,
      paidAt: booking.remainingPaidAt,
      paymentUrl: paymentSummary.remaining.paymentUrl,
      payableOnline: paymentSummary.remaining.payableOnline,
    },
    nextPayment: paymentSummary.nextPayment,
    paymentNotice: paymentSummary.notice,
    allPaid: paymentSummary.deposit.paid && paymentSummary.remaining.paid,
  };
}
