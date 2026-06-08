import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockTranslate, mockResolveQuotePack, mockGetTemplateSettings, mockCreateQuote, mockGenerateQuoteHTML } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
    leadNote: { create: vi.fn() },
    leadActivity: { count: vi.fn() },
    adminLog: { create: vi.fn() },
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
    web: {
      url: 'https://test.orbita.events',
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
const { mockRecordEmailSend, mockUpdateEmailSendResult } = vi.hoisted(() => ({
  mockRecordEmailSend: vi.fn().mockResolvedValue({ id: 'es-test-1', trackingToken: 'tt-1' }),
  mockUpdateEmailSendResult: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: (html: string) => html,
}));
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadEmailSent: vi.fn(),
}));
vi.mock('@/lib/services/customerActivityService', () => ({
  recordCustomerEmailSent: vi.fn(),
}));

import { sendAdminEmail } from '@/lib/services/adminEmailSendService';
import { recordLeadEmailSent } from '@/lib/services/leadActivityService';
import { recordCustomerEmailSent } from '@/lib/services/customerActivityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.leadNote.create.mockResolvedValue({});
  mockPrisma.leadActivity.count.mockResolvedValue(0);
  mockPrisma.adminLog.create.mockResolvedValue({});
  // sendEmail retorna SendEmailResult; donem un default vàlid amb tot OK
  mockSendEmail.mockResolvedValue({
    ok: true,
    smtp: { accepted: ['client@test.com'], rejected: [], response: '250 OK', messageId: '<m1@test>' },
    imapSent: { attempted: true, ok: true, folder: 'INBOX/Sent', uid: 1 },
    orbitaMessageId: '<orbita.admin.na.aaa.bbb@orbitaevents.com>',
  });
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

  it('crea leadNote i registra leadActivity via capa shared si leadId', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', preferredLocale: 'ca' });

    await sendAdminEmail({
      to: 'client@test.com',
      subject: 'Seguiment',
      body: 'Benvolgut/da',
      leadId: 'l1',
    });

    expect(mockPrisma.leadNote.create).toHaveBeenCalled();
    expect(recordLeadEmailSent).toHaveBeenCalledWith(expect.objectContaining({
      leadId: 'l1',
      subject: 'Seguiment',
      hasAttachments: false,
    }));
  });

  it('registra customerActivity via capa shared si customerId', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'cust1', preferredLocale: 'es' });

    await sendAdminEmail({
      to: 'client@test.com',
      subject: 'Info',
      body: 'Cos del missatge',
      customerId: 'cust1',
    });

    expect(recordCustomerEmailSent).toHaveBeenCalledWith({
      customerId: 'cust1',
      to: 'client@test.com',
      subject: 'Info',
      source: 'admin_emails_send',
    });
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

  // ─── Bug #799 fix: adminLog COMM_SENT ─────────────────────────────────────
  it('escriu adminLog COMM_SENT amb entity=lead si hi ha leadId', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', preferredLocale: 'ca' });
    await sendAdminEmail({ to: 'a@test.com', subject: 'Hola', body: 'Cos', leadId: 'l1' });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'COMM_SENT',
        entity: 'lead',
        entityId: 'l1',
        details: expect.objectContaining({ to: 'a@test.com', channel: 'email', flow: 'admin_compose' }),
      }),
    }));
  });

  it('escriu adminLog COMM_SENT amb entity=customer si hi ha customerId sense leadId', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', preferredLocale: 'es' });
    await sendAdminEmail({ to: 'b@test.com', subject: 'Salut', body: 'Cos', customerId: 'c1' });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'COMM_SENT',
        entity: 'customer',
        entityId: 'c1',
      }),
    }));
  });

  it('escriu adminLog COMM_SENT amb entity=admin_email si no hi ha lead ni customer', async () => {
    await sendAdminEmail({ to: 'c@test.com', subject: 'Cap', body: 'Cos' });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'COMM_SENT',
        entity: 'admin_email',
        entityId: null,
      }),
    }));
  });

  // ─── #800: snapshot HTML body al EmailSend ─────────────────────────────────
  it('passa htmlBody (HTML brandejat) a recordEmailSend per a previsualització admin', async () => {
    await sendAdminEmail({ to: 'a@test.com', subject: 'Subject', body: 'Cos del missatge' });
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'a@test.com',
      subject: 'Subject',
      htmlBody: expect.stringContaining('Cos del missatge'),
    }));
  });

  it('vincula emailSendId al leadActivity quan hi ha lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', preferredLocale: 'ca' });
    const { recordLeadEmailSent } = await import('@/lib/services/leadActivityService');
    await sendAdminEmail({ to: 'a@test.com', subject: 'Subject', body: 'Cos', leadId: 'l1' });
    expect(recordLeadEmailSent).toHaveBeenCalledWith(expect.objectContaining({
      leadId: 'l1',
      subject: 'Subject',
      emailSendId: 'es-test-1',
    }));
  });

  // ─── #821: observabilitat del canal (SMTP info + APPEND) ───────────────────
  it('passa context orbita=lead a sendEmail i a recordEmailSend quan hi ha leadId', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'L1', preferredLocale: 'ca' });
    await sendAdminEmail({ to: 'a@test.com', subject: 'S', body: 'B', leadId: 'L1' });

    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      orbita: expect.objectContaining({ kind: 'lead', id: 'L1' }),
    }));
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      orbitaKind: 'lead',
      orbitaId: 'L1',
      orbitaOrigin: 'admin-compose',
    }));
  });

  it('passa context orbita=customer si només hi ha customerId', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'C2', preferredLocale: 'es' });
    await sendAdminEmail({ to: 'a@test.com', subject: 'S', body: 'B', customerId: 'C2' });

    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      orbita: expect.objectContaining({ kind: 'customer', id: 'C2' }),
    }));
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      orbitaKind: 'customer',
      orbitaId: 'C2',
    }));
  });

  it('passa context orbita=admin si no hi ha lead ni customer', async () => {
    await sendAdminEmail({ to: 'a@test.com', subject: 'S', body: 'B' });
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      orbita: expect.objectContaining({ kind: 'admin' }),
    }));
  });

  it('marca admin-compose-quote com a origin quan hi ha pressupost adjunt', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'L1', preferredLocale: 'ca' });
    await sendAdminEmail({
      to: 'a@test.com', subject: 'S', body: 'B', leadId: 'L1',
      quote: { packId: 'basic', price: 500 },
    });
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      orbita: expect.objectContaining({ origin: 'admin-compose-quote' }),
    }));
  });

  it('persisteix el resultat real del canal (SMTP+IMAP) a l\'EmailSend', async () => {
    mockSendEmail.mockResolvedValueOnce({
      ok: true,
      smtp: {
        accepted: ['client@test.com'],
        rejected: [],
        response: '250 2.0.0 Ok: queued as ABC',
        messageId: '<m-xyz@test>',
      },
      imapSent: { attempted: true, ok: true, folder: 'INBOX/Sent', uid: 42 },
      orbitaMessageId: '<orbita.admin.na.aa.bb@orbitaevents.com>',
    });

    await sendAdminEmail({ to: 'client@test.com', subject: 'S', body: 'B' });

    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('es-test-1', expect.objectContaining({
      smtpAccepted: ['client@test.com'],
      smtpRejected: [],
      smtpResponse: '250 2.0.0 Ok: queued as ABC',
      smtpMessageId: '<m-xyz@test>',
      imapAppendOk: true,
      imapSentFolder: 'INBOX/Sent',
      imapSentUid: 42,
      imapError: null,
    }));
  });

  it('imapAppendOk=null quan IMAP no està configurat (attempted=false)', async () => {
    mockSendEmail.mockResolvedValueOnce({
      ok: true,
      smtp: { accepted: ['a@b.com'], rejected: [], response: '250 OK', messageId: '<m1>' },
      imapSent: { attempted: false, ok: false, folder: null },
      orbitaMessageId: null,
    });
    await sendAdminEmail({ to: 'a@b.com', subject: 'S', body: 'B' });
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('es-test-1', expect.objectContaining({
      imapAppendOk: null,
    }));
  });

  it('imapAppendOk=false + imapError quan APPEND ha fallat', async () => {
    mockSendEmail.mockResolvedValueOnce({
      ok: true,
      smtp: { accepted: ['a@b.com'], rejected: [], response: '250 OK', messageId: '<m1>' },
      imapSent: { attempted: true, ok: false, folder: null, error: "Mailbox doesn't exist: Sent" },
      orbitaMessageId: null,
    });
    await sendAdminEmail({ to: 'a@b.com', subject: 'S', body: 'B' });
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('es-test-1', expect.objectContaining({
      imapAppendOk: false,
      imapError: "Mailbox doesn't exist: Sent",
    }));
  });
});
