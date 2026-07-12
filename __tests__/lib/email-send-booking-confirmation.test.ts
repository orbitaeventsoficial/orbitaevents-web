import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockSendMail,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
} = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: mockSendMail }),
  },
}));

vi.mock('@/lib/site', () => ({
  getAppBaseUrl: () => 'https://test.orbita.events',
  absoluteUrl: (url: string, baseUrl: string) => (
    url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  ),
}));

vi.mock('@/lib/services/imageManagerService', () => ({
  getManagedImageOverride: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
}));

import {
  sendBookingConfirmation,
  sendPrivacyVerificationEmail,
  sendTestimonialApprovedEmail,
  sendTrackedStandaloneEmail,
} from '@/lib/email';

const BASE_BOOKING = {
  id: 'booking-1',
  customerId: 'cust-1',
  reference: 'OE-2026-001',
  preferredLocale: 'ca',
  eventDate: new Date('2026-09-15T00:00:00.000Z'),
  eventStartTime: '18:00',
  eventEndTime: '02:00',
  eventLocation: 'Barcelona',
  eventVenue: 'Masia Test',
  guestCount: 80,
  clientName: 'Maria López',
  clientEmail: 'maria@example.com',
  clientPhone: '+34699111222',
  eventType: 'BIRTHDAY',
  total: 605,
  extraHours: 1,
  notes: null,
  pack: {
    slug: 'pack-zen',
    price: 500,
    extraHourPrice: 90,
    translations: [
      { locale: 'ca', name: 'Pack Zen' },
      { locale: 'es', name: 'Pack Zen ES' },
      { locale: 'en', name: 'Zen Pack' },
    ],
  },
  extras: [
    {
      price: 50,
      extra: {
        slug: 'karaoke',
        translations: [
          { locale: 'ca', name: 'Karaoke' },
          { locale: 'es', name: 'Karaoke ES' },
          { locale: 'en', name: 'Karaoke EN' },
        ],
      },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SMTP_HOST = 'smtp.test';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'user@test';
  process.env.SMTP_PASS = 'secret';
  process.env.SMTP_FROM = 'from@test';
  delete process.env.IMAP_HOST;
  delete process.env.IMAP_USER;
  delete process.env.IMAP_PASS;

  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-public-booking-1', trackingToken: 'public-booking-token' });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
  mockWrapLinksForTracking.mockImplementation((html: string, token: string, baseUrl: string) =>
    `${html}<a href="${baseUrl}/api/tracking/click/${token}?url=https%3A%2F%2Ftest.orbita.events%2Fcontacto">tracked</a>`
  );
  mockSendMail.mockResolvedValue({
    accepted: ['maria@example.com'],
    rejected: [],
    response: '250 OK',
    messageId: 'smtp-message-1',
    envelope: { from: 'from@test', to: ['maria@example.com'] },
  });
});

describe('sendBookingConfirmation', () => {
  it('crea EmailSend abans del SMTP i envia la sol·licitud pública amb tracking', async () => {
    await sendBookingConfirmation(BASE_BOOKING);

    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'public-booking-request',
      to: 'maria@example.com',
      subject: 'Sol·licitud de reserva rebuda #OE-2026-001 - Òrbita Events',
      customerId: 'cust-1',
      locale: 'ca',
      htmlBody: expect.stringContaining('Sol·licitud de reserva rebuda'),
      orbitaKind: 'booking',
      orbitaId: 'booking-1',
      orbitaOrigin: 'public-booking-request',
    }));
    expect(mockRecordEmailSend.mock.invocationCallOrder[0]).toBeLessThan(mockSendMail.mock.invocationCallOrder[0]);

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe('maria@example.com');
    expect(mockWrapLinksForTracking).toHaveBeenCalledWith(
      expect.stringContaining('Sol·licitud de reserva rebuda'),
      'public-booking-token',
      'https://test.orbita.events'
    );
    expect(mail.html).toContain('/api/tracking/open/public-booking-token');
    expect(mail.messageId).toContain('orbita.booking.booking-1');

    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-public-booking-1', expect.objectContaining({
      smtpAccepted: ['maria@example.com'],
      smtpRejected: [],
      smtpResponse: '250 OK',
      smtpMessageId: 'smtp-message-1',
      imapAppendOk: null,
      imapSentFolder: null,
      imapSentUid: null,
    }));
  });

  it('no envia SMTP si no pot crear EmailSend', async () => {
    mockRecordEmailSend.mockRejectedValueOnce(new Error('tracking KO'));

    await expect(sendBookingConfirmation(BASE_BOOKING)).rejects.toThrow('tracking KO');

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('marca EmailSend fallit si SMTP falla', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(sendBookingConfirmation(BASE_BOOKING)).rejects.toThrow('SMTP down');

    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-public-booking-1', expect.objectContaining({
      smtpAccepted: [],
      smtpRejected: ['maria@example.com'],
      smtpResponse: 'SMTP down',
      smtpMessageId: '',
      imapAppendOk: null,
    }));
  });
});

describe('tracked standalone client emails', () => {
  it('envia verificació de privacitat amb EmailSend i orbita admin', async () => {
    await sendPrivacyVerificationEmail({
      to: 'privacy@example.com',
      name: 'Joan',
      requestType: 'access',
      requestId: 'req-1',
      verificationToken: 'verify-token',
      legalDeadline: new Date('2026-08-01T00:00:00.000Z'),
      locale: 'ca',
    });

    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'privacy-verification',
      to: 'privacy@example.com',
      locale: 'ca',
      htmlBody: expect.stringContaining('req-1'),
      orbitaKind: 'admin',
      orbitaId: 'privacy-req-1',
      orbitaOrigin: 'privacy-verification',
    }));
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.html).toContain('/api/tracking/open/public-booking-token');
    expect(mail.messageId).toContain('orbita.admin.privacy-req-1');
  });

  it('envia testimonial aprovat exportat sense saltar-se EmailSend', async () => {
    await sendTestimonialApprovedEmail({
      to: 'ana@example.com',
      name: 'Ana Pérez',
      rating: 5,
      discountCode: 'ANA10',
      discountPercent: 10,
      locale: 'es',
    });

    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'testimonial-approved',
      to: 'ana@example.com',
      locale: 'es',
      htmlBody: expect.stringContaining('ANA10'),
      orbitaKind: 'customer',
      orbitaId: null,
      orbitaOrigin: 'testimonial-approved',
    }));
    expect(mockSendMail.mock.calls[0][0].html).toContain('/api/tracking/open/public-booking-token');
  });

  it('exporta helper standalone traçat per avisos admin i contacte web', async () => {
    await sendTrackedStandaloneEmail({
      templateKey: 'new-lead-admin-notification',
      to: 'admin@example.com',
      subject: 'Nou lead',
      html: '<html><body>Hola admin</body></html>',
      leadId: 'lead-1',
      replyTo: 'client@example.com',
      from: '"Web Òrbita" <from@test>',
      orbita: { kind: 'lead', id: 'lead-1', origin: 'new-lead-admin-notification' },
    });

    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'new-lead-admin-notification',
      to: 'admin@example.com',
      subject: 'Nou lead',
      leadId: 'lead-1',
      htmlBody: '<html><body>Hola admin</body></html>',
      orbitaKind: 'lead',
      orbitaId: 'lead-1',
      orbitaOrigin: 'new-lead-admin-notification',
    }));
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.replyTo).toBe('client@example.com');
    expect(mail.from).toBe('"Web Òrbita" <from@test>');
    expect(mail.html).toContain('/api/tracking/open/public-booking-token');
  });
});
