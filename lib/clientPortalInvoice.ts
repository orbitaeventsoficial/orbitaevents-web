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

export type ClientPortalInvoiceRecord = {
  reference: string;
  status: string;
  pdfUrl: string | null;
  createdAt?: Date | null;
};

export type ClientPortalDeliveryNote = {
  reference: string;
  status: string;
  pdfUrl: string | null;
  signedAt: Date | null;
  createdAt?: Date | null;
};

export type ClientPortalDeliveryNoteDocument = {
  reference: string;
  pdfUrl: string;
  signedAt: Date | null;
};

export type ClientPortalInvoiceSummary = {
  documentType: 'INVOICE' | 'PROPOSAL' | null;
  documentReference: string | null;
  proposalReference: string | null;
  invoiceReference: string | null;
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

export function getClientPortalDeliveryNoteDocument(
  deliveryNotes: ClientPortalDeliveryNote[],
): ClientPortalDeliveryNoteDocument | null {
  const signedWithPdf = deliveryNotes
    .filter((deliveryNote) => deliveryNote.status === 'SIGNED' && !!deliveryNote.pdfUrl)
    .map((deliveryNote) => ({
      reference: deliveryNote.reference,
      pdfUrl: deliveryNote.pdfUrl as string,
      signedAt: deliveryNote.signedAt,
      sortDate: deliveryNote.signedAt ?? deliveryNote.createdAt ?? new Date(0),
    }))
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  const latest = signedWithPdf[0];
  if (!latest) return null;

  return {
    reference: latest.reference,
    pdfUrl: latest.pdfUrl,
    signedAt: latest.signedAt,
  };
}

function getClientPortalInvoiceDocument(invoices: ClientPortalInvoiceRecord[]): ClientPortalInvoiceRecord | null {
  return invoices
    .filter((invoice) => invoice.status !== 'CANCELLED' && !!invoice.pdfUrl)
    .map((invoice) => ({
      ...invoice,
      sortDate: invoice.createdAt ?? new Date(0),
    }))
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())[0] ?? null;
}

export function getClientPortalInvoiceSummary(
  booking: ClientPortalInvoiceBooking,
  proposals: ClientPortalInvoiceProposal[],
  invoices: ClientPortalInvoiceRecord[] = [],
): ClientPortalInvoiceSummary {
  const latestInvoice = getClientPortalInvoiceDocument(invoices);
  const latestWithPdf = proposals.find((p) => !!p.pdfUrl) ?? proposals[0] ?? null;
  const paymentSummary = getClientPortalPaymentSummary(booking);
  return {
    documentType: latestInvoice ? 'INVOICE' : latestWithPdf ? 'PROPOSAL' : null,
    documentReference: latestInvoice?.reference ?? latestWithPdf?.reference ?? null,
    proposalReference: latestWithPdf?.reference ?? null,
    invoiceReference: latestInvoice?.reference ?? null,
    pdfUrl: latestInvoice?.pdfUrl ?? latestWithPdf?.pdfUrl ?? null,
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
