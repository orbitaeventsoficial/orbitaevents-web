/**
 * Tests per paymentReminderService — recordatoris automàtics de pagament.
 * Mock de Prisma + sendEmail per testejar la lògica sense BD ni SMTP.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (vi.hoisted per evitar TDZ amb vi.mock hoisting) ────────────────

const { mockSendEmail, mockPrisma } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue(undefined),
  mockPrisma: {
    booking: { findMany: vi.fn() },
    adminLog: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/constants', () => ({
  PLACEHOLDER_EMAIL_DOMAIN: '@leads.orbitaevents.local',
  formatCurrency: (n: number) => `${n} €`,
  formatDateFull: (d: Date) => d.toISOString().split('T')[0],
}));

import { sendPaymentReminders } from '@/lib/services/paymentReminderService';

// ─── Helpers ────────────────────────────────────────────────────────────────

function futureDate(daysAhead: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d;
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    reference: 'ORB-001',
    clientName: 'Joan Garcia',
    clientEmail: 'joan@example.com',
    eventDate: futureDate(10),
    total: 3000,
    depositAmount: 1000,
    depositPaid: false,
    remainingPaid: false,
    preferredLocale: 'ca',
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('sendPaymentReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      }),
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledOnce();
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
