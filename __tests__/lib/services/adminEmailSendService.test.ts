import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockTranslate, mockResolveQuotePack, mockGetTemplateSettings, mockCreateQuote, mockGenerateQuoteHTML } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
    leadNote: { create: vi.fn() },
    leadActivity: { create: vi.fn(), count: vi.fn() },
    customerActivity: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
  mockTranslate: vi.fn(),
  mockResolveQuotePack: vi.fn(),
  mockGetTemplateSettings: vi.fn(),
  mockCreateQuote: vi.fn(),
  mockGenerateQuoteHTML: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
  getEmailSignatureHtml: () => '<div>Signature</div>',
}));
vi.mock('@/lib/services/translationService', () => ({
  translateTextForLocale: mockTranslate,
}));
vi.mock('@/lib/services/quotes/quotePack', () => ({
  resolveQuotePack: mockResolveQuotePack,
}));
vi.mock('@/lib/services/quoteTemplateService', () => ({
  getQuoteTemplateSettings: mockGetTemplateSettings,
}));
vi.mock('@/lib/services/documentService', () => ({
  createQuoteFromLead: mockCreateQuote,
  generateQuoteHTML: mockGenerateQuoteHTML,
}));
vi.mock('@/lib/utils/sanitize', () => ({
  escapeHtml: (s: string) => s,
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: {
      email: 'info@orbita.events',
      phone: '+34600000000',
      phoneDisplay: '+34 600 000 000',
    },
  },
}));
vi.mock('@/lib/site', () => ({
  getAppBaseUrl: () => 'https://test.orbita.events',
  absoluteUrl: (path: string, base: string) => path.startsWith('http') ? path : `${base}${path}`,
}));
vi.mock('@/lib/services/imageManagerService', () => ({
  getManagedImageOverride: vi.fn().mockResolvedValue(null),
}));

import { sendAdminEmail } from '@/lib/services/adminEmailSendService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.leadNote.create.mockResolvedValue({});
  mockPrisma.leadActivity.create.mockResolvedValue({});
  mockPrisma.leadActivity.count.mockResolvedValue(0);
  mockPrisma.customerActivity.create.mockResolvedValue({});
  mockSendEmail.mockResolvedValue({});
  mockTranslate.mockImplementation((text: string) => Promise.resolve(text));
  mockResolveQuotePack.mockResolvedValue({ name: 'Basic', price: 500, djHours: 4, extraHourPrice: 75, description: 'Pack bàsic' });
  mockGetTemplateSettings.mockResolvedValue({ validityDays: 30, introTitle: '', introSubtitle: '', ctaTitle: '', ctaSubtitle: '', conditions: '' });
  mockCreateQuote.mockReturnValue({ quoteNumber: 'Q-001', total: 605 });
  mockGenerateQuoteHTML.mockReturnValue('<html>quote</html>');
});

describe('sendAdminEmail', () => {
  it('retorna 400 sense camps obligatoris', async () => {
    const result = await sendAdminEmail({});
    expect(result.status).toBe(400);
  });

  it('retorna 400 sense to', async () => {
    const result = await sendAdminEmail({ subject: 'Test', body: 'Hola' });
    expect(result.status).toBe(400);
  });

  it('envia email bàsic', async () => {
    const result = await sendAdminEmail({
      to: 'client@test.com',
      subject: 'Hola',
      body: 'Missatge de prova',
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'client@test.com',
      })
    );
  });

  it('crea leadNote i leadActivity si leadId', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', preferredLocale: 'ca' });

    await sendAdminEmail({
      to: 'client@test.com',
      subject: 'Seguiment',
      body: 'Benvolgut/da',
      leadId: 'l1',
    });

    expect(mockPrisma.leadNote.create).toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).toHaveBeenCalled();
  });

  it('crea customerActivity si customerId', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'cust1', preferredLocale: 'es' });

    await sendAdminEmail({
      to: 'client@test.com',
      subject: 'Info',
      body: 'Cos del missatge',
      customerId: 'cust1',
    });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust1',
          action: 'EMAIL_SENT',
        }),
      })
    );
  });

  it('retorna 400 si quote sense pack vàlid', async () => {
    const result = await sendAdminEmail({
      to: 'client@test.com',
      subject: 'Pressupost',
      body: 'Adjunt',
      quote: { packId: '', price: 0 },
    });

    expect(result.status).toBe(400);
  });

  it('adjunta pressupost si quote vàlid', async () => {
    const result = await sendAdminEmail({
      to: 'client@test.com',
      subject: 'Pressupost',
      body: 'Adjunt trobaràs el pressupost',
      quote: { packId: 'basic', price: 500 },
    });

    expect(result.ok).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({ contentType: 'text/html; charset=utf-8' }),
        ]),
      })
    );
  });
});
