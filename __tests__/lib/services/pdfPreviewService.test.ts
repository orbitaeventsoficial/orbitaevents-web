import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateQuotePDF: vi.fn(),
  generateContractPDF: vi.fn(),
  generateInvoicePDF: vi.fn(),
  getCompanyConfig: vi.fn(),
}));

function pdfDocStub(label: string) {
  return {
    output: vi.fn(() => Buffer.from(`%PDF-${label}`).buffer),
  };
}

vi.mock('@/app/config/packs-config', () => ({
  getPacksByService: vi.fn(() => [
    {
      name: 'Pack Canonical',
      price: '800€',
      priceValue: 800,
      durationHours: 6,
      popular: true,
      features: ['So', 'Llums'],
      capacidadMinima: 80,
      capacidadMaxima: 120,
    },
  ]),
  EXTRAS: [
    { name: 'Extra real', price: 100, compatibleWith: ['bodas'], enabled: true },
    { name: 'Extra desactivat', price: 200, compatibleWith: ['bodas'], enabled: false },
    { name: 'Extra incompatible', price: 300, compatibleWith: ['empresas'], enabled: true },
  ],
}));

vi.mock('@/lib/constants', () => ({
  EVENT_TYPE_DOCUMENT_LABELS: { WEDDING: 'Casament' },
}));

vi.mock('@/lib/constants/pdfDocuments', () => ({
  PDF_PREVIEW_PLACEHOLDER: 'XXXXXX',
}));

vi.mock('@/lib/constants/pricing', () => ({
  VAT_RATE_INVOICE: 21,
  calcDeposit: vi.fn((total: number) => Math.round(total * 0.3)),
  calcVatAmount: vi.fn((subtotal: number) => Math.round(subtotal * 0.21)),
  roundMoney: vi.fn((value: number) => Math.round(value * 100) / 100),
}));

vi.mock('@/lib/pdf-utils', () => ({
  generateQuotePDF: mocks.generateQuotePDF,
  generateContractPDF: mocks.generateContractPDF,
}));

vi.mock('@/lib/services/contractService', () => ({
  getCompanyConfig: mocks.getCompanyConfig,
  getDefaultCancellationPolicy: vi.fn(() => 'Cancel·lacio canonica'),
  getDefaultTermsAndConditions: vi.fn(() => 'Condicions canoniques'),
}));

vi.mock('@/lib/services/invoicePdfService', () => ({
  generateInvoicePDF: mocks.generateInvoicePDF,
}));

vi.mock('@/lib/services/quoteTemplateService', () => ({
  DEFAULT_QUOTE_TEMPLATE: {
    validityDays: 30,
    conditions: ['Condicio canonica'],
  },
}));

import {
  renderCanonicalContractPreview,
  renderCanonicalInvoicePreview,
  renderCanonicalQuotePreview,
} from '@/lib/services/pdfPreviewService';

describe('pdfPreviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateQuotePDF.mockResolvedValue(pdfDocStub('quote'));
    mocks.generateContractPDF.mockResolvedValue(pdfDocStub('contract'));
    mocks.generateInvoicePDF.mockResolvedValue(pdfDocStub('invoice'));
    mocks.getCompanyConfig.mockResolvedValue({
      name: 'Orbita Events',
      legalName: 'Orbita Events SL',
      nif: 'B-real',
      address: 'Adreca real',
      iban: 'IBAN real',
      phone: 'Telefon real',
      email: 'email-real',
    });
  });

  it('renderitza pressupost amb dades contextuals XXXXXX i imports canonics', async () => {
    const buffer = await renderCanonicalQuotePreview('ca');
    expect(buffer.length).toBeGreaterThan(0);
    expect(mocks.generateQuotePDF).toHaveBeenCalledWith(expect.objectContaining({
      reference: 'XXXXXX',
      date: 'XXXXXX',
      issueDate: 'XXXXXX',
      eventSchedule: 'XXXXXX',
      eventLocation: 'XXXXXX',
      clientName: 'XXXXXX',
      clientEmail: 'XXXXXX',
      clientPhone: 'XXXXXX',
      basePrice: 800,
      extrasPrice: 100,
      total: 900,
      validityDays: 30,
      conditions: ['Condicio canonica'],
    }), 'ca');
  });

  it('renderitza contracte amb placeholders i calculs de pack reals', async () => {
    await renderCanonicalContractPreview('ca');
    expect(mocks.generateContractPDF).toHaveBeenCalledWith(expect.objectContaining({
      contractReference: 'XXXXXX',
      contractDate: 'XXXXXX',
      clientName: 'XXXXXX',
      clientNIF: 'XXXXXX',
      clientAddress: 'XXXXXX',
      clientEmail: 'XXXXXX',
      clientPhone: 'XXXXXX',
      eventDate: 'XXXXXX',
      eventTime: 'XXXXXX',
      eventEndTime: 'XXXXXX',
      eventLocation: 'XXXXXX',
      packName: 'Pack Canonical',
      packPrice: 800,
      djHours: 6,
      subtotal: 900,
      vatRate: 21,
      vatAmount: 189,
      total: 1089,
      depositAmount: 327,
      depositDueDate: 'XXXXXX',
      finalPaymentDue: 'XXXXXX',
    }), 'ca');
  });

  it('renderitza factura amb placeholders i linies del cataleg', async () => {
    await renderCanonicalInvoicePreview('ca');
    expect(mocks.generateInvoicePDF).toHaveBeenCalledWith(expect.objectContaining({
      invoiceNumber: 'XXXXXX',
      issueDate: 'XXXXXX',
      dueDate: 'XXXXXX',
      clientName: 'XXXXXX',
      clientNIF: 'XXXXXX',
      clientAddress: 'XXXXXX',
      clientEmail: 'XXXXXX',
      clientPhone: 'XXXXXX',
      eventDate: 'XXXXXX',
      eventLocation: 'XXXXXX',
      subtotal: 900,
      vatRate: 21,
      vatAmount: 189,
      total: 1089,
      depositAmount: 327,
      remainingAmount: 762,
      lines: [
        { description: 'Pack Canonical', quantity: 1, unitPrice: 800, total: 800 },
        { description: 'Extra real', quantity: 1, unitPrice: 100, total: 100 },
      ],
    }), 'ca');
  });
});
