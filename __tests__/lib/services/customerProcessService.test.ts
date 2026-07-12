import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockPrisma,
  mockSendEmail,
  mockBuildTestimonialApprovedEmailPayload,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
} = vi.hoisted(() => ({
  mockPrisma: {
    customer: { findUnique: vi.fn() },
    customerActivity: { create: vi.fn() },
    discountCode: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
  mockBuildTestimonialApprovedEmailPayload: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
  buildTestimonialApprovedEmailPayload: mockBuildTestimonialApprovedEmailPayload,
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { phone: '+34600000000' } },
}));
vi.mock('@/lib/site', () => ({
  getAppBaseUrl: () => 'https://test.orbita.events',
}));
vi.mock('@/lib/services/customerActivityService', () => ({
  recordCustomerProcessStarted: vi.fn(),
}));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
}));

import { startCustomerProcess } from '@/lib/services/customerProcessService';
import { recordCustomerProcessStarted } from '@/lib/services/customerActivityService';

const smtpResult = {
  ok: true,
  smtp: {
    accepted: ['test@test.com'],
    rejected: [],
    response: '250 OK',
    messageId: 'smtp-message-1',
  },
  imapSent: {
    attempted: true,
    ok: true,
    folder: 'Sent',
    uid: 42,
  },
  orbitaMessageId: '<orbita.customer.c1@example.test>',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.discountCode.create.mockResolvedValue({});
  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-1', trackingToken: 'track-1' });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
  mockWrapLinksForTracking.mockImplementation((html: string, token: string) => `${html}<span data-token="${token}"></span>`);
  mockSendEmail.mockResolvedValue(smtpResult);
  mockBuildTestimonialApprovedEmailPayload.mockReturnValue({
    to: 'test@test.com',
    subject: 'Gràcies pel teu testimoni',
    html: '<p>testimonial html</p>',
    locale: 'es',
  });
  vi.mocked(recordCustomerProcessStarted).mockResolvedValue({});
});

describe('startCustomerProcess', () => {
  it('retorna 400 sense customerId', async () => {
    const result = await startCustomerProcess({ customerId: '', processType: 'welcome' });
    expect(result.status).toBe(400);
  });

  it('retorna 400 amb processType invàlid', async () => {
    const result = await startCustomerProcess({ customerId: 'c1', processType: 'invalid' });
    expect(result.status).toBe(400);
  });

  it('retorna 404 si client no existeix', async () => {
    const result = await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });
    expect(result.status).toBe(404);
  });

  it('retorna 400 si el client no té email', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: null, name: 'Maria', preferredLocale: 'ca' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });

    expect(result.status).toBe(400);
    expect(mockRecordEmailSend).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('envia email de benvinguda amb EmailSend snapshot abans del SMTP', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: ' test@test.com ', name: 'Maria', preferredLocale: 'ca' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });

    expect(result.status).toBe(200);
    expect(result.body.processType).toBe('welcome');
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'customer-welcome',
      to: 'test@test.com',
      customerId: 'c1',
      locale: 'ca',
      htmlBody: expect.stringContaining('BENVINGUT/DA'),
      orbitaKind: 'customer',
      orbitaId: 'c1',
      orbitaOrigin: 'customer-process-welcome',
    }));
    expect(mockRecordEmailSend.mock.invocationCallOrder[0]).toBeLessThan(mockSendEmail.mock.invocationCallOrder[0]);
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@test.com',
      html: expect.stringContaining('/api/tracking/open/track-1'),
      orbita: { kind: 'customer', id: 'c1', origin: 'customer-process-welcome' },
    }));
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-1', expect.objectContaining({
      smtpAccepted: ['test@test.com'],
      smtpResponse: '250 OK',
      smtpMessageId: 'smtp-message-1',
      imapAppendOk: true,
      imapSentFolder: 'Sent',
      imapSentUid: 42,
    }));
  });

  it('envia review request amb tracking de link i pixel', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Pau', preferredLocale: 'ca' });

    const result = await startCustomerProcess({ customerId: 'c1', bookingId: 'b1', processType: 'review_request' });

    expect(result.status).toBe(200);
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'customer-review-request',
      orbitaKind: 'booking',
      orbitaId: 'b1',
      orbitaOrigin: 'customer-process-review_request',
    }));
    expect(mockWrapLinksForTracking).toHaveBeenCalledWith(
      expect.stringContaining('https://test.orbita.events/ca/opiniones/nueva'),
      'track-1',
      'https://test.orbita.events'
    );
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      orbita: { kind: 'booking', id: 'b1', origin: 'customer-process-review_request' },
    }));
  });

  it('post_event crea codi descompte i envia el payload testimonial per EmailSend', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Laura García', preferredLocale: 'es' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'post_event' });

    expect(result.status).toBe(200);
    expect(mockPrisma.discountCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PERCENTAGE',
        value: 10,
        sourceType: 'POST_EVENT',
      }),
    });
    expect(mockBuildTestimonialApprovedEmailPayload).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@test.com',
      name: 'Laura García',
      rating: 5,
      discountPercent: 10,
      locale: 'es',
    }));
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'customer-post-event',
      subject: 'Gràcies pel teu testimoni',
      htmlBody: '<p>testimonial html</p>',
    }));
  });

  it('promo crea codi 15% i envia email amb snapshot', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Anna', preferredLocale: 'ca' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'promo' });

    expect(result.status).toBe(200);
    expect(mockPrisma.discountCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PERCENTAGE',
        value: 15,
        sourceType: 'PROMOTION',
      }),
    });
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'customer-promo',
      htmlBody: expect.stringContaining('15% DESCOMPTE'),
    }));
  });

  it('crea customerActivity amb emailSendId després del procés', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Marc', preferredLocale: 'ca' });

    await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });

    expect(recordCustomerProcessStarted).toHaveBeenCalledWith({
      customerId: 'c1',
      processType: 'welcome',
      emailSendId: 'email-send-1',
      emailSnapshot: 'EmailSend.htmlBody',
    });
  });

  it('no envia SMTP ni activitat si falla EmailSend', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Marc', preferredLocale: 'ca' });
    mockRecordEmailSend.mockRejectedValueOnce(new Error('tracking down'));

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });

    expect(result.status).toBe(502);
    expect(result.body).toEqual({
      success: false,
      processType: 'welcome',
      error: 'No s\'ha pogut enviar el procés al client',
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(recordCustomerProcessStarted).not.toHaveBeenCalled();
  });

  it('marca EmailSend fallit i no crea activitat si falla SMTP', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Marc', preferredLocale: 'ca' });
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });

    expect(result.status).toBe(502);
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-1', expect.objectContaining({
      smtpAccepted: [],
      smtpRejected: ['test@test.com'],
      smtpResponse: 'SMTP down',
      smtpMessageId: '',
    }));
    expect(recordCustomerProcessStarted).not.toHaveBeenCalled();
  });
});
