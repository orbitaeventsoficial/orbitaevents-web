import { describe, it, expect } from 'vitest';
import {
  buildClientPortalInvoicePath,
  getClientPortalDeliveryNoteDocument,
  getClientPortalInvoiceSummary,
  type ClientPortalDeliveryNote,
  type ClientPortalInvoiceBooking,
  type ClientPortalInvoiceRecord,
  type ClientPortalInvoiceProposal,
} from '@/lib/clientPortalInvoice';

function makeBooking(overrides: Partial<ClientPortalInvoiceBooking> = {}): ClientPortalInvoiceBooking {
  return {
    depositAmount: 300,
    depositPaid: false,
    depositPaidAt: null,
    remainingAmount: 700,
    remainingPaid: false,
    remainingPaidAt: null,
    ...overrides,
  };
}

describe('buildClientPortalInvoicePath', () => {
  it('construeix la ruta correcta', () => {
    expect(buildClientPortalInvoicePath('ca', 'tok123')).toBe('/ca/portal/tok123/invoice');
    expect(buildClientPortalInvoicePath('en', 'xyz')).toBe('/en/portal/xyz/invoice');
  });
});

describe('getClientPortalInvoiceSummary', () => {
  it('total és la suma de bestreta + resta', () => {
    const result = getClientPortalInvoiceSummary(makeBooking(), []);
    expect(result.total).toBe(1000);
  });

  it('retorna el primer pressupost amb PDF', () => {
    const proposals: ClientPortalInvoiceProposal[] = [
      { reference: 'P-001', pdfUrl: null },
      { reference: 'P-002', pdfUrl: '/uploads/p2.pdf' },
    ];
    const result = getClientPortalInvoiceSummary(makeBooking(), proposals);
    expect(result.proposalReference).toBe('P-002');
    expect(result.pdfUrl).toBe('/uploads/p2.pdf');
    expect(result.documentType).toBe('PROPOSAL');
    expect(result.documentReference).toBe('P-002');
  });

  it('prioritza la factura PDF activa per sobre del pressupost', () => {
    const proposals: ClientPortalInvoiceProposal[] = [
      { reference: 'P-002', pdfUrl: '/uploads/p2.pdf' },
    ];
    const invoices: ClientPortalInvoiceRecord[] = [
      { reference: 'FAC-2026-0001', status: 'DRAFT', pdfUrl: '/uploads/fac.pdf', createdAt: new Date('2026-07-10T10:00:00Z') },
    ];

    const result = getClientPortalInvoiceSummary(makeBooking(), proposals, invoices);

    expect(result.documentType).toBe('INVOICE');
    expect(result.documentReference).toBe('FAC-2026-0001');
    expect(result.invoiceReference).toBe('FAC-2026-0001');
    expect(result.proposalReference).toBe('P-002');
    expect(result.pdfUrl).toBe('/uploads/fac.pdf');
  });

  it('si cap pressupost té PDF agafa el primer', () => {
    const proposals: ClientPortalInvoiceProposal[] = [
      { reference: 'P-001', pdfUrl: null },
    ];
    const result = getClientPortalInvoiceSummary(makeBooking(), proposals);
    expect(result.proposalReference).toBe('P-001');
    expect(result.pdfUrl).toBeNull();
  });

  it('sense propostes retorna nulls', () => {
    const result = getClientPortalInvoiceSummary(makeBooking(), []);
    expect(result.proposalReference).toBeNull();
    expect(result.pdfUrl).toBeNull();
  });

  it('allPaid true quan bestreta i resta pagades', () => {
    const booking = makeBooking({ depositPaid: true, remainingPaid: true });
    expect(getClientPortalInvoiceSummary(booking, []).allPaid).toBe(true);
  });

  it('allPaid true quan cashAmount cobreix tot encara que els flags siguin falsos', () => {
    const booking = makeBooking({ total: 1000, cashAmount: 1000 });
    const result = getClientPortalInvoiceSummary(booking, []);

    expect(result.allPaid).toBe(true);
    expect(result.deposit.paid).toBe(true);
    expect(result.remaining.paid).toBe(true);
  });

  it('allPaid false si qualsevol import pendent', () => {
    expect(getClientPortalInvoiceSummary(makeBooking({ depositPaid: true }), []).allPaid).toBe(false);
    expect(getClientPortalInvoiceSummary(makeBooking(), []).allPaid).toBe(false);
  });

  it('exposa dates de pagament quan existeixen', () => {
    const paidAt = new Date('2026-03-01T10:00:00Z');
    const booking = makeBooking({ depositPaid: true, depositPaidAt: paidAt });
    const result = getClientPortalInvoiceSummary(booking, []);
    expect(result.deposit.paidAt).toEqual(paidAt);
    expect(result.remaining.paidAt).toBeNull();
  });

  it('reutilitza la regla canònica de pagament online per bestreta', () => {
    const result = getClientPortalInvoiceSummary(
      makeBooking({ depositPaymentUrl: 'https://checkout.stripe.com/c/deposit' }),
      [],
    );

    expect(result.nextPayment).toBe('deposit');
    expect(result.paymentNotice).toBe('deposit_payable');
    expect(result.deposit.payableOnline).toBe(true);
    expect(result.deposit.paymentUrl).toBe('https://checkout.stripe.com/c/deposit');
  });

  it('reutilitza la regla canònica de pagament online per resta només si la bestreta està pagada', () => {
    const result = getClientPortalInvoiceSummary(
      makeBooking({
        depositPaid: true,
        remainingPaymentUrl: 'https://checkout.stripe.com/c/remaining',
      }),
      [],
    );

    expect(result.nextPayment).toBe('remaining');
    expect(result.paymentNotice).toBe('remaining_payable');
    expect(result.remaining.payableOnline).toBe(true);
    expect(result.remaining.paymentUrl).toBe('https://checkout.stripe.com/c/remaining');
  });
});

describe('getClientPortalDeliveryNoteDocument', () => {
  it('retorna null si no hi ha albarà signat amb PDF', () => {
    const deliveryNotes: ClientPortalDeliveryNote[] = [
      {
        reference: 'ALB-2026-0001',
        status: 'DRAFT',
        pdfUrl: '/api/uploads/delivery-notes/draft.pdf',
        signedAt: null,
        createdAt: new Date('2026-07-01T10:00:00Z'),
      },
      {
        reference: 'ALB-2026-0002',
        status: 'SIGNED',
        pdfUrl: null,
        signedAt: new Date('2026-07-02T10:00:00Z'),
      },
    ];

    expect(getClientPortalDeliveryNoteDocument(deliveryNotes)).toBeNull();
  });

  it('tria l’albarà signat amb PDF més recent', () => {
    const deliveryNotes: ClientPortalDeliveryNote[] = [
      {
        reference: 'ALB-2026-0001',
        status: 'SIGNED',
        pdfUrl: '/api/uploads/delivery-notes/old.pdf',
        signedAt: new Date('2026-07-01T10:00:00Z'),
      },
      {
        reference: 'ALB-2026-0003',
        status: 'SIGNED',
        pdfUrl: '/api/uploads/delivery-notes/new.pdf',
        signedAt: new Date('2026-07-03T10:00:00Z'),
      },
      {
        reference: 'ALB-2026-0004',
        status: 'CANCELLED',
        pdfUrl: '/api/uploads/delivery-notes/cancelled.pdf',
        signedAt: new Date('2026-07-04T10:00:00Z'),
      },
    ];

    expect(getClientPortalDeliveryNoteDocument(deliveryNotes)).toEqual({
      reference: 'ALB-2026-0003',
      pdfUrl: '/api/uploads/delivery-notes/new.pdf',
      signedAt: new Date('2026-07-03T10:00:00Z'),
    });
  });
});
