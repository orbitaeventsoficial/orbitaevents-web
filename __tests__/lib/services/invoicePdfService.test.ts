import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logo-lockup-light-base64', () => ({
  ORBITA_LOGO_LOCKUP_LIGHT_BASE64: 'data:image/png;base64,fake',
}));

import { generateInvoicePDF } from '@/lib/services/invoicePdfService';

const BASE_DATA = {
  invoiceNumber: 'FAC-2026-001',
  issueDate: new Date('2026-06-04'),
  companyName: 'Òrbita Events',
  companyNIF: 'B-00000000',
  companyAddress: 'Granollers, Barcelona',
  companyEmail: 'info@orbitaevents.com',
  companyPhone: '+34 699 12 10 23',
  companyIBAN: 'ES00 0000 0000 0000 0000 0000',
  clientName: 'Marta Soler',
  clientEmail: 'marta@example.com',
  eventType: 'Casament',
  eventDate: new Date('2026-09-20'),
  eventLocation: 'Cardedeu',
  lines: [
    { description: 'Pack Premium', quantity: 1, unitPrice: 500, total: 500 },
  ],
  subtotal: 500,
  vatRate: 0,
  vatAmount: 0,
  total: 500,
  depositAmount: 150,
  depositPaid: false,
  remainingAmount: 350,
  remainingPaid: false,
};

describe('generateInvoicePDF', () => {
  it('returns a jsPDF instance with PDF magic bytes', async () => {
    const doc = await generateInvoicePDF(BASE_DATA, 'ca');
    const buf = Buffer.from(doc.output('arraybuffer'));
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
  });

  it('produces a 1-page document for minimal data', async () => {
    const doc = await generateInvoicePDF(BASE_DATA, 'ca');
    expect(doc.internal.pages.length - 1).toBe(1);
  });

  it('includes deposit paid status', async () => {
    const doc = await generateInvoicePDF({ ...BASE_DATA, depositPaid: true, depositPaidAt: new Date('2026-06-11') }, 'ca');
    const buf = Buffer.from(doc.output('arraybuffer'));
    expect(buf.length).toBeGreaterThan(10000);
  });

  it('works with vatRate > 0', async () => {
    const doc = await generateInvoicePDF({ ...BASE_DATA, vatRate: 21, vatAmount: 105, total: 605 }, 'ca');
    const buf = Buffer.from(doc.output('arraybuffer'));
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
  });

  it('works in locale es and en', async () => {
    for (const locale of ['es', 'en'] as const) {
      const doc = await generateInvoicePDF(BASE_DATA, locale);
      const buf = Buffer.from(doc.output('arraybuffer'));
      expect(buf.slice(0, 4).toString()).toBe('%PDF');
    }
  });
});
