import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockGetTemplate,
  mockSendEmail,
  mockIsSmtpConfigured,
  mockLogError,
  mockGetAppBaseUrl,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
} = vi.hoisted(() => ({
  mockPrisma: { packTranslation: { findUnique: vi.fn() } },
  mockGetTemplate: vi.fn(),
  mockSendEmail: vi.fn(),
  mockIsSmtpConfigured: vi.fn(),
  mockLogError: vi.fn(),
  mockGetAppBaseUrl: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/emailTemplateService', () => ({ getTemplate: mockGetTemplate }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/env', () => ({ isSmtpConfigured: mockIsSmtpConfigured }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: mockGetAppBaseUrl }));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
}));

import { sendBookingConfirmationEmail } from '@/lib/services/bookingConfirmationEmailService';

const BASE = {
  to: 'client@example.com',
  reference: 'OE-2026-001',
  clientName: 'Cristina Rey',
  eventDate: new Date('2026-07-12'),
  startTime: '19:00',
  endTime: '02:00',
  packId: 'pack-1',
  location: 'Masia Can Roda',
  total: 605,
  depositAmount: 181.5,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsSmtpConfigured.mockReturnValue(true);
  mockPrisma.packTranslation.findUnique.mockResolvedValue({ name: 'VIP Experience' });
  mockGetTemplate.mockResolvedValue({ subject: 'Reserva OE-2026-001', bodyHtml: '<p>ok</p>', source: 'db' });
  mockGetAppBaseUrl.mockReturnValue('https://test.orbita.events/');
  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-booking-1', trackingToken: 'booking-token-1' });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
  mockWrapLinksForTracking.mockImplementation((html: string, token: string) => `${html}<a href="/tracked/${token}">tracked</a>`);
  mockSendEmail.mockResolvedValue({
    ok: true,
    smtp: { accepted: ['client@example.com'], rejected: [], response: '250 OK', messageId: '<booking@test>' },
    imapSent: { attempted: true, ok: true, folder: 'Sent', uid: 23 },
    orbitaMessageId: '<orbita.booking.booking-1.a.b@orbitaevents.com>',
  });
});

describe('sendBookingConfirmationEmail', () => {
  it('usa la plantilla editable (getTemplate booking_confirmation) i envia', async () => {
    const r = await sendBookingConfirmationEmail(BASE);
    expect(r.ok).toBe(true);
    expect(mockGetTemplate).toHaveBeenCalledWith('booking_confirmation', 'es', expect.objectContaining({
      reference: 'OE-2026-001', clientName: 'Cristina Rey', packName: 'VIP Experience',
    }));
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'client@example.com' }));
  });

  it('desa EmailSend amb htmlBody, tracking i resultat SMTP/IMAP', async () => {
    const r = await sendBookingConfirmationEmail({
      ...BASE,
      bookingId: 'booking-1',
      leadId: 'lead-1',
      customerId: 'cust-1',
      locale: 'ca',
    });

    expect(r.ok).toBe(true);
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'booking_confirmation',
      to: 'client@example.com',
      subject: 'Reserva OE-2026-001',
      leadId: 'lead-1',
      customerId: 'cust-1',
      locale: 'ca',
      htmlBody: '<p>ok</p>',
      orbitaKind: 'lead',
      orbitaId: 'lead-1',
      orbitaOrigin: 'booking-confirmation',
    }));
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('/api/tracking/open/booking-token-1'),
      orbita: { kind: 'lead', id: 'lead-1', origin: 'booking-confirmation' },
    }));
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-booking-1', expect.objectContaining({
      smtpAccepted: ['client@example.com'],
      smtpRejected: [],
      smtpResponse: '250 OK',
      smtpMessageId: '<booking@test>',
      imapAppendOk: true,
      imapSentFolder: 'Sent',
      imapSentUid: 23,
      imapError: null,
    }));
  });

  it('passa el total i dipòsit SENSE símbol € (la plantilla l\'afegeix)', async () => {
    await sendBookingConfirmationEmail(BASE);
    const vars = mockGetTemplate.mock.calls[0][2];
    expect(vars.total).not.toContain('€');
    expect(vars.depositAmount).not.toContain('€');
  });

  it('error si no hi ha email de destí', async () => {
    const r = await sendBookingConfirmationEmail({ ...BASE, to: '' });
    expect(r.ok).toBe(false);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('degradació segura si sendEmail falla', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));
    const r = await sendBookingConfirmationEmail(BASE);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('SMTP');
  });

  it('no envia si no pot crear EmailSend canònic', async () => {
    mockRecordEmailSend.mockRejectedValueOnce(new Error('tracking KO'));

    const r = await sendBookingConfirmationEmail(BASE);

    expect(r.ok).toBe(false);
    expect(r.error).toContain('tracking KO');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('marca skipped si SMTP no està configurat i no genera error vermell', async () => {
    mockIsSmtpConfigured.mockReturnValue(false);

    const r = await sendBookingConfirmationEmail(BASE);

    expect(r).toEqual({ ok: false, skipped: 'smtp_not_configured', error: 'SMTP no configurat' });
    expect(mockGetTemplate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('normalitza el locale (ca/en vàlids, la resta → es)', async () => {
    await sendBookingConfirmationEmail({ ...BASE, locale: 'en' });
    expect(mockGetTemplate).toHaveBeenCalledWith('booking_confirmation', 'en', expect.anything());
  });
});
