import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════ MOCKS ═══════════

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    extra: { findMany: vi.fn() },
    leadNote: { create: vi.fn() },
    leadDocument: { create: vi.fn() },
    leadActivity: { count: vi.fn() },
    adminLog: { create: vi.fn() },
  },
}));

const { mockEmail } = vi.hoisted(() => ({
  mockEmail: { sendEmail: vi.fn() },
}));

const { mockDocService } = vi.hoisted(() => ({
  mockDocService: {
    createQuoteFromLead: vi.fn(),
    generateQuoteHTML: vi.fn(),
    generateQuoteNumber: vi.fn(),
  },
}));

const { mockQuotePack } = vi.hoisted(() => ({
  mockQuotePack: { resolveQuotePack: vi.fn() },
}));

const { mockTemplateService } = vi.hoisted(() => ({
  mockTemplateService: { getQuoteTemplateSettings: vi.fn() },
}));

const { mockTranslation } = vi.hoisted(() => ({
  mockTranslation: {
    translateHtmlForLocale: vi.fn(),
    translateTextForLocale: vi.fn(),
  },
}));

const { mockParsing } = vi.hoisted(() => ({
  mockParsing: {
    mapLeadEventType: vi.fn(),
    normalizeQuoteLocale: vi.fn(),
    parseDateOrNull: vi.fn(),
  },
}));

const { mockFollowUp } = vi.hoisted(() => ({
  mockFollowUp: { ensureQuoteFollowUpTask: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => mockEmail);
vi.mock('@/lib/services/documentService', () => mockDocService);
vi.mock('@/lib/services/quotes/quotePack', () => mockQuotePack);
vi.mock('@/lib/services/quoteTemplateService', () => mockTemplateService);
vi.mock('@/lib/services/translationService', () => mockTranslation);
vi.mock('@/lib/services/quotes/quoteParsing', () => mockParsing);
vi.mock('@/lib/services/tasks/quoteFollowUp', () => mockFollowUp);
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadQuoteSent: vi.fn(),
}));
vi.mock('@/lib/services/customerActivityService', () => ({
  recordCustomerQuoteSent: vi.fn(),
}));
vi.mock('@/lib/utils/normalize', () => ({
  normalizeEmail: (e: string) => e.toLowerCase().trim(),
  normalizePhone: (p: string) => p.replace(/\s/g, ''),
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { email: 'admin@orbita.com', phone: '+34699121023' }, web: { url: 'https://test.orbita.events' } },
}));

import { sendAdminQuoteEmail } from '@/lib/services/adminQuoteEmailService';
import { recordLeadQuoteSent } from '@/lib/services/leadActivityService';
import { recordCustomerQuoteSent } from '@/lib/services/customerActivityService';

const defaultTemplate = {
  validityDays: 30,
  introTitle: 'Pressupost',
  introSubtitle: 'Per al teu event',
  ctaTitle: 'Reserva',
  ctaSubtitle: 'Contacta',
  conditions: 'Condicions',
  sendAdminCopy: false,
  adminCopyEmail: null,
};

const defaultPack = { name: 'Premium', price: 1500, djHours: 6, description: 'Pack Premium', extraHourPrice: 75 };

const defaultLead = {
  id: 'lead1',
  name: 'Test Client',
  email: 'test@test.com',
  phone: '600123456',
  eventType: 'WEDDING',
  eventDate: new Date('2026-06-15'),
  eventLocation: 'Barcelona',
  guestCount: 100,
  budget: '2000',
  message: null,
  interestedPackId: 'premium',
  interestedExtras: [],
  source: 'web',
  preferredLocale: 'ca',
  customerId: 'cust1',
  status: 'NEW',
};

beforeEach(() => {
  vi.clearAllMocks();

  mockTemplateService.getQuoteTemplateSettings.mockResolvedValue(defaultTemplate);
  mockQuotePack.resolveQuotePack.mockResolvedValue(defaultPack);
  mockDocService.generateQuoteHTML.mockReturnValue('<html>quote</html>');
  mockDocService.createQuoteFromLead.mockReturnValue({
    total: 1815,
    validUntil: null,
    quoteNumber: null,
    notes: undefined,
  });
  mockDocService.generateQuoteNumber.mockReturnValue('ORB-2026-100');
  mockTranslation.translateHtmlForLocale.mockResolvedValue('<html>translated</html>');
  mockTranslation.translateTextForLocale.mockResolvedValue('Pressupost ORB-2026-100');
  mockParsing.normalizeQuoteLocale.mockReturnValue('ca');
  mockParsing.mapLeadEventType.mockReturnValue('WEDDING');
  mockParsing.parseDateOrNull.mockReturnValue(null);
  mockFollowUp.ensureQuoteFollowUpTask.mockResolvedValue({});
  mockEmail.sendEmail.mockResolvedValue({});

  mockPrisma.lead.findUnique.mockResolvedValue(defaultLead);
  mockPrisma.lead.update.mockResolvedValue(defaultLead);
  mockPrisma.lead.create.mockResolvedValue({ ...defaultLead, id: 'newlead' });
  mockPrisma.lead.findFirst.mockResolvedValue(null);
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.customer.findFirst.mockResolvedValue(null);
  mockPrisma.leadNote.create.mockResolvedValue({});
  mockPrisma.leadDocument.create.mockResolvedValue({});
  mockPrisma.leadActivity.count.mockResolvedValue(0);
  mockPrisma.adminLog.create.mockResolvedValue({});
});

// ═══════════ VALIDACIÓ ═══════════

describe('sendAdminQuoteEmail — validació', () => {
  it('retorna 400 sense body', async () => {
    const result = await sendAdminQuoteEmail(undefined);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('retorna 400 sense leadId, customerId ni to', async () => {
    const result = await sendAdminQuoteEmail({ packId: 'premium', price: 1500 });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('retorna 400 sense packId', async () => {
    const result = await sendAdminQuoteEmail({ leadId: 'lead1', price: 1500 });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('retorna 400 sense price numèric', async () => {
    const result = await sendAdminQuoteEmail({ leadId: 'lead1', packId: 'premium' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it('retorna 404 si lead no existeix', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    const result = await sendAdminQuoteEmail({ leadId: 'nonexist', packId: 'premium', price: 1500 });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it('retorna 400 sense email de destinatari', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    const result = await sendAdminQuoteEmail({
      customerId: 'cust1',
      packId: 'premium',
      price: 1500,
    });
    // customerId without email → 400
    expect(result.ok).toBe(false);
  });
});

// ═══════════ FLUX AMB LEAD ═══════════

describe('sendAdminQuoteEmail — amb lead', () => {
  it('envia email i actualitza lead a QUOTE_SENT', async () => {
    const result = await sendAdminQuoteEmail({
      leadId: 'lead1',
      packId: 'premium',
      price: 1500,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.body.quoteNumber).toBe('ORB-2026-100');

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead1' },
      data: expect.objectContaining({ status: 'QUOTE_SENT' }),
    });
    expect(mockPrisma.leadNote.create).toHaveBeenCalled();
    expect(mockPrisma.leadDocument.create).toHaveBeenCalled();
    expect(recordLeadQuoteSent).toHaveBeenCalledWith({
      leadId: 'lead1',
      quoteNumber: 'ORB-2026-100',
      to: 'test@test.com',
      total: 1815,
    });
    expect(mockEmail.sendEmail).toHaveBeenCalled();
  });

  it('crea tasca de seguiment', async () => {
    await sendAdminQuoteEmail({ leadId: 'lead1', packId: 'premium', price: 1500 });

    expect(mockFollowUp.ensureQuoteFollowUpTask).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'lead1',
        customerId: 'cust1',
      }),
    );
  });

  it('registra activitat customer si lead té customerId', async () => {
    await sendAdminQuoteEmail({ leadId: 'lead1', packId: 'premium', price: 1500 });

    expect(recordCustomerQuoteSent).toHaveBeenCalledWith({
      customerId: 'cust1',
      leadId: 'lead1',
      quoteNumber: 'ORB-2026-100',
      total: 1815,
    });
  });

  it('usa branding hero per primer email', async () => {
    mockPrisma.leadActivity.count.mockResolvedValue(0);

    await sendAdminQuoteEmail({ leadId: 'lead1', packId: 'premium', price: 1500 });

    expect(mockEmail.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ brandingStyle: 'hero' }),
    );
  });

  it('usa branding soft per emails posteriors', async () => {
    mockPrisma.leadActivity.count.mockResolvedValue(3);

    await sendAdminQuoteEmail({ leadId: 'lead1', packId: 'premium', price: 1500 });

    expect(mockEmail.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ brandingStyle: 'soft' }),
    );
  });

  it('tradueix HTML i subject segons locale del lead', async () => {
    await sendAdminQuoteEmail({ leadId: 'lead1', packId: 'premium', price: 1500 });

    expect(mockTranslation.translateHtmlForLocale).toHaveBeenCalled();
    expect(mockTranslation.translateTextForLocale).toHaveBeenCalled();
  });
});

// ═══════════ FLUX AMB EMAIL DIRECTE ═══════════

describe('sendAdminQuoteEmail — amb email directe (to)', () => {
  it('envia a email directe sense lead ni customer', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    // Necessitem un lead creat automàticament
    mockPrisma.lead.create.mockResolvedValue({
      ...defaultLead,
      id: 'newlead',
      customerId: null,
    });

    const result = await sendAdminQuoteEmail({
      to: 'extern@test.com',
      customerName: 'Client Extern',
      packId: 'premium',
      price: 1500,
    });

    expect(result.ok).toBe(true);
    expect(mockEmail.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'extern@test.com' }),
    );
  });
});

// ═══════════ CÒPIA ADMIN ═══════════

describe('sendAdminQuoteEmail — còpia admin', () => {
  it('envia còpia admin si configurat', async () => {
    mockTemplateService.getQuoteTemplateSettings.mockResolvedValue({
      ...defaultTemplate,
      sendAdminCopy: true,
      adminCopyEmail: 'admin@orbita.com',
    });

    const result = await sendAdminQuoteEmail({
      leadId: 'lead1',
      packId: 'premium',
      price: 1500,
    });

    expect(result.ok).toBe(true);
    expect(result.body.adminCopySent).toBe(true);
    // 2 emails: client + admin
    expect(mockEmail.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('no envia còpia si sendAdminCopy=false', async () => {
    const result = await sendAdminQuoteEmail({
      leadId: 'lead1',
      packId: 'premium',
      price: 1500,
    });

    expect(result.body.adminCopySent).toBe(false);
    expect(mockEmail.sendEmail).toHaveBeenCalledTimes(1);
  });
});

// ═══════════ EXTRAS ═══════════

describe('sendAdminQuoteEmail — extras', () => {
  it('accepta extras com objectes', async () => {
    const result = await sendAdminQuoteEmail({
      leadId: 'lead1',
      packId: 'premium',
      price: 1500,
      extras: [{ name: 'Fum baix', price: 150, quantity: 1 }],
    });

    expect(result.ok).toBe(true);
  });

  it('resol extras com slugs des de BD', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([
      {
        slug: 'low-fog',
        price: 150,
        translations: [{ locale: 'ca', name: 'Fum baix', description: null }],
      },
    ]);

    const result = await sendAdminQuoteEmail({
      leadId: 'lead1',
      packId: 'premium',
      price: 1500,
      extras: ['low-fog'],
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.extra.findMany).toHaveBeenCalled();
  });
});

// ═══════════ LINK LEAD-CUSTOMER ═══════════

describe('sendAdminQuoteEmail — vinculació lead-customer', () => {
  it('vincula lead a customer si customerId diferent', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ ...defaultLead, customerId: null });
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust2', name: 'Alt Client', email: 'alt@test.com', preferredLocale: 'es',
    });

    await sendAdminQuoteEmail({
      leadId: 'lead1',
      customerId: 'cust2',
      packId: 'premium',
      price: 1500,
    });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead1' },
        data: { customerId: 'cust2' },
      }),
    );
  });
});
