import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  getTemplate,
  sendEmail,
  mockGetAppBaseUrl,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
} = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  sendEmail: vi.fn(),
  mockGetAppBaseUrl: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
}));
vi.mock('@/lib/services/emailTemplateService', () => ({ getTemplate }));
vi.mock('@/lib/email', () => ({ sendEmail }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: mockGetAppBaseUrl }));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
}));

import { sendLeadWelcomeEmail } from '@/lib/services/leadWelcomeEmailService';

beforeEach(() => {
  getTemplate.mockReset();
  sendEmail.mockReset();
  mockGetAppBaseUrl.mockReset();
  mockRecordEmailSend.mockReset();
  mockUpdateEmailSendResult.mockReset();
  mockWrapLinksForTracking.mockReset();
  mockGetAppBaseUrl.mockReturnValue('https://test.orbita.events/');
  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-welcome-1', trackingToken: 'welcome-token-1' });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
  mockWrapLinksForTracking.mockImplementation((html: string, token: string) => `${html}<a href="/tracked/${token}">tracked</a>`);
  sendEmail.mockResolvedValue({
    ok: true,
    smtp: { accepted: ['alba@x.com'], rejected: [], response: '250 OK', messageId: '<welcome@test>' },
    imapSent: { attempted: true, ok: true, folder: 'Sent', uid: 11 },
    orbitaMessageId: '<orbita.lead.lead-1.a.b@orbitaevents.com>',
  });
});

describe('sendLeadWelcomeEmail', () => {
  it('renderitza la plantilla welcome en el locale i envia', async () => {
    getTemplate.mockResolvedValue({ subject: 'Benvingut/da!', bodyHtml: '<p>Hola Alba</p>' });
    const res = await sendLeadWelcomeEmail({ to: 'alba@x.com', clientName: 'Alba', locale: 'ca', leadId: 'lead-1' });
    expect(res.ok).toBe(true);
    expect(getTemplate).toHaveBeenCalledWith('welcome', 'ca', { clientName: 'Alba' });
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'welcome',
      to: 'alba@x.com',
      subject: 'Benvingut/da!',
      leadId: 'lead-1',
      customerId: null,
      locale: 'ca',
      htmlBody: '<p>Hola Alba</p>',
      orbitaKind: 'lead',
      orbitaId: 'lead-1',
      orbitaOrigin: 'lead-welcome',
    }));
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'alba@x.com',
      subject: 'Benvingut/da!',
      html: expect.stringContaining('/api/tracking/open/welcome-token-1'),
      orbita: { kind: 'lead', id: 'lead-1', origin: 'lead-welcome' },
    }));
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-welcome-1', expect.objectContaining({
      smtpAccepted: ['alba@x.com'],
      smtpRejected: [],
      smtpResponse: '250 OK',
      smtpMessageId: '<welcome@test>',
      imapAppendOk: true,
      imapSentFolder: 'Sent',
      imapSentUid: 11,
      imapError: null,
    }));
  });

  it('locale desconegut cau a es', async () => {
    getTemplate.mockResolvedValue({ subject: 's', bodyHtml: 'b' });
    sendEmail.mockResolvedValue({});
    await sendLeadWelcomeEmail({ to: 'x@x.com', clientName: 'X', locale: 'pt' });
    expect(getTemplate).toHaveBeenCalledWith('welcome', 'es', { clientName: 'X' });
  });

  it('sense destinatari no envia', async () => {
    const res = await sendLeadWelcomeEmail({ to: '  ', clientName: 'X' });
    expect(res.ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('si l\'enviament falla, degrada segur (ok:false)', async () => {
    getTemplate.mockResolvedValue({ subject: 's', bodyHtml: 'b' });
    sendEmail.mockRejectedValue(new Error('SMTP down'));
    const res = await sendLeadWelcomeEmail({ to: 'x@x.com', clientName: 'X', locale: 'es' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('SMTP down');
  });

  it('si falla EmailSend no envia SMTP', async () => {
    getTemplate.mockResolvedValue({ subject: 's', bodyHtml: 'b' });
    mockRecordEmailSend.mockRejectedValueOnce(new Error('tracking KO'));

    const res = await sendLeadWelcomeEmail({ to: 'x@x.com', clientName: 'X', locale: 'es', leadId: 'lead-1' });

    expect(res.ok).toBe(false);
    expect(res.error).toContain('tracking KO');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
