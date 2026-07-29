/**
 * Tests per paymentReminderService — recordatoris automàtics de pagament.
 * Mock de Prisma + sendEmail per testejar la lògica sense BD ni SMTP.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (vi.hoisted per evitar TDZ amb vi.mock hoisting) ────────────────

const {
  mockSendEmail,
  mockPrisma,
  mockGetAppBaseUrl,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
} = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue(undefined),
  mockPrisma: {
    booking: { findMany: vi.fn() },
    adminLog: { findFirst: vi.fn(), create: vi.fn() },
  },
  mockGetAppBaseUrl: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: mockGetAppBaseUrl }));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
}));
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    formatCurrency: (n: number) => `${n} €`,
    formatDateFull: (d: Date) => d.toISOString().split('T')[0],
  };
});

import { sendPaymentReminders } from '@/lib/services/paymentReminderService';

// ─── Helpers ────────────────────────────────────────────────────────────────

function futureDate(daysAhead: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d;
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  const booking = {
    id: 'booking-1',
    reference: 'ORB-001',
    clientName: 'Joan Garcia',
    clientEmail: 'joan@example.com',
    eventDate: futureDate(10),
    total: 3000,
    depositAmount: 1000,
    remainingAmount: 2000,
    depositPaid: false,
    remainingPaid: false,
    cashAmount: null,
    preferredLocale: 'ca',
    ...overrides,
  };
  if (!Object.prototype.hasOwnProperty.call(overrides, 'remainingAmount')) {
    booking.remainingAmount = Number(booking.total || 0) - Number(booking.depositAmount || 0);
  }
  return booking;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('sendPaymentReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppBaseUrl.mockReturnValue('https://test.orbita.events/');
    mockRecordEmailSend.mockResolvedValue({ id: 'email-send-payment-1', trackingToken: 'payment-token-1' });
    mockUpdateEmailSendResult.mockResolvedValue(undefined);
    mockWrapLinksForTracking.mockImplementation((html: string, token: string) => `${html}<a href="/tracked/${token}">tracked</a>`);
    mockSendEmail.mockResolvedValue({
      ok: true,
      smtp: { accepted: ['joan@example.com'], rejected: [], response: '250 OK', messageId: '<payment@test>' },
      imapSent: { attempted: true, ok: true, folder: 'Sent', uid: 71 },
      orbitaMessageId: '<orbita.booking.booking-1.a.b@orbitaevents.com>',
    });
  });

  it('envia recordatori per reserva amb pagament pendent', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([makeBooking()]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null); // cap recordatori recent
    mockPrisma.adminLog.create.mockResolvedValue({});

    const result = await sendPaymentReminders();

    expect(result.checked).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joan@example.com',
        subject: expect.stringContaining('ORB-001'),
        html: expect.stringContaining('/api/tracking/open/payment-token-1'),
        orbita: { kind: 'booking', id: 'booking-1', origin: 'payment-reminder' },
      }),
    );
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'payment-reminder',
      to: 'joan@example.com',
      subject: expect.stringContaining('ORB-001'),
      locale: 'ca',
      htmlBody: expect.stringContaining('Import pendent:'),
      orbitaKind: 'booking',
      orbitaId: 'booking-1',
      orbitaOrigin: 'payment-reminder',
    }));
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-payment-1', expect.objectContaining({
      smtpAccepted: ['joan@example.com'],
      smtpRejected: [],
      smtpResponse: '250 OK',
      smtpMessageId: '<payment@test>',
      imapAppendOk: true,
      imapSentFolder: 'Sent',
      imapSentUid: 71,
      imapError: null,
    }));
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          remainingAmount: true,
          cashAmount: true,
        }),
      }),
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledOnce();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({
            emailSendId: 'email-send-payment-1',
            emailSnapshot: 'EmailSend.htmlBody',
            orbitaKind: 'booking',
            orbitaId: 'booking-1',
            orbitaOrigin: 'payment-reminder',
          }),
        }),
      }),
    );
  });

  it('salta si ja hi ha recordatori recent (MIN_DAYS_BETWEEN_REMINDERS)', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([makeBooking()]);
    mockPrisma.adminLog.findFirst.mockResolvedValue({ id: 'log-1' }); // recordatori recent

    const result = await sendPaymentReminders();

    expect(result.checked).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('salta emails placeholder', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ clientEmail: 'phone-612@leads.orbitaevents.local' }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);

    const result = await sendPaymentReminders();

    expect(result.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('salta si no hi ha email', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ clientEmail: null }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);

    const result = await sendPaymentReminders();

    expect(result.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('salta si el pendent és 0 (tot pagat parcialment)', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ depositPaid: true, remainingPaid: false, total: 1000, depositAmount: 1000 }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);

    const result = await sendPaymentReminders();

    // remaining = 1000 - 1000 = 0, deposit ja pagat → skip
    expect(result.skipped).toBe(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('salta si l\'efectiu cobreix tot el pendent encara que els flags siguin falsos', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ total: 3000, depositAmount: 1000, remainingAmount: 2000, cashAmount: 3000 }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);

    const result = await sendPaymentReminders();

    expect(result.checked).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).not.toHaveBeenCalled();
  });

  it('calcula correctament import pendent (dipòsit + resta)', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ total: 5000, depositAmount: 2000, depositPaid: false, remainingPaid: false }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockPrisma.adminLog.create.mockResolvedValue({});

    await sendPaymentReminders();

    // pendingAmount = 2000 (dipòsit) + 3000 (resta) = 5000
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({ pendingAmount: 5000 }),
        }),
      }),
    );
  });

  it('resta efectiu parcial i no llista el tram que ja queda cobert', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({
        total: 3000,
        depositAmount: 1000,
        remainingAmount: 2000,
        depositPaid: false,
        remainingPaid: false,
        cashAmount: 1000,
      }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockPrisma.adminLog.create.mockResolvedValue({});

    await sendPaymentReminders();

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({ pendingAmount: 2000 }),
        }),
      }),
    );
    const email = mockSendEmail.mock.calls[0]?.[0] as { html: string };
    expect(email.html).toContain('Import pendent: 2000 €');
    expect(email.html).toContain('<li>Resta: 2000 €</li>');
    expect(email.html).not.toContain('<li>Dipòsit:');
  });

  it('envia només resta si dipòsit ja pagat', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ total: 3000, depositAmount: 1000, depositPaid: true, remainingPaid: false }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockPrisma.adminLog.create.mockResolvedValue({});

    await sendPaymentReminders();

    // pendingAmount = 3000 - 1000 = 2000 (resta)
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({ pendingAmount: 2000 }),
        }),
      }),
    );
  });

  it('retorna checked=0 si no hi ha reserves pendents', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await sendPaymentReminders();

    expect(result).toEqual({ checked: 0, sent: 0, skipped: 0, errors: 0 });
  });

  it('compta error si sendEmail falla', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([makeBooking()]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP error'));

    const result = await sendPaymentReminders();

    expect(result.errors).toBe(1);
    expect(result.sent).toBe(0);
  });

  it('no envia ni registra adminLog si no pot crear EmailSend', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([makeBooking()]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockRecordEmailSend.mockRejectedValueOnce(new Error('tracking KO'));

    const result = await sendPaymentReminders();

    expect(result.errors).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).not.toHaveBeenCalled();
  });

  it('usa locale correcte per l\'email (es)', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ preferredLocale: 'es' }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockPrisma.adminLog.create.mockResolvedValue({});

    await sendPaymentReminders();

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Recordatorio de pago'),
      }),
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({ locale: 'es' }),
        }),
      }),
    );
  });

  it('usa locale en per preferredLocale en anglès', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ preferredLocale: 'en-GB' }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockPrisma.adminLog.create.mockResolvedValue({});

    await sendPaymentReminders();

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Payment reminder'),
      }),
    );
  });

  it('usa referència curta (id slice) si no hi ha reference', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking({ reference: null, id: 'abcdef1234567890' }),
    ]);
    mockPrisma.adminLog.findFirst.mockResolvedValue(null);
    mockPrisma.adminLog.create.mockResolvedValue({});

    await sendPaymentReminders();

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('abcdef12'),
      }),
    );
  });
});
