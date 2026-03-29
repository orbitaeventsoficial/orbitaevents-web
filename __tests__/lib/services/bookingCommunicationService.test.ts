import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockSendWhatsAppText } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findUnique: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
  mockSendWhatsAppText: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/services/whatsappService', () => ({ sendWhatsAppText: mockSendWhatsAppText }));
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    toIntlLocale: (l: string) => {
      if (l === 'ca') return 'ca-ES';
      if (l === 'en') return 'en-GB';
      return 'es-ES';
    },
  };
});

import {
  parseBookingCommunicationBody,
  executeBookingCommunication,
} from '@/lib/services/bookingCommunicationService';

const BOOKING = {
  id: 'bk-1',
  reference: 'OE-2026-001',
  clientName: 'Joan Garcia',
  clientEmail: 'joan@example.com',
  clientPhone: '+34612345678',
  eventDate: new Date('2026-06-15'),
  depositAmount: 500,
  remainingAmount: 1500,
  preferredLocale: 'ca',
};

describe('parseBookingCommunicationBody', () => {
  it('parseja body vàlid', () => {
    const result = parseBookingCommunicationBody({ action: 'send_email', flow: 'PAYMENT' });
    expect(result).toEqual({ action: 'send_email', flow: 'PAYMENT', channel: undefined });
  });

  it('parseja amb canal', () => {
    const result = parseBookingCommunicationBody({ action: 'log_sent', flow: 'GENERAL', channel: 'whatsapp' });
    expect(result).toEqual({ action: 'log_sent', flow: 'GENERAL', channel: 'whatsapp' });
  });

  it('retorna null per body invàlid', () => {
    expect(parseBookingCommunicationBody(null)).toBeNull();
    expect(parseBookingCommunicationBody({})).toBeNull();
    expect(parseBookingCommunicationBody({ action: 'invalid', flow: 'PAYMENT' })).toBeNull();
    expect(parseBookingCommunicationBody({ action: 'send_email', flow: 'INVALID' })).toBeNull();
  });

  it('retorna null si canal invàlid', () => {
    expect(parseBookingCommunicationBody({ action: 'send_email', flow: 'PAYMENT', channel: 'sms' })).toBeNull();
  });
});

describe('executeBookingCommunication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.booking.findUnique.mockResolvedValue(BOOKING);
    mockPrisma.adminLog.create.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);
    mockSendWhatsAppText.mockResolvedValue({ ok: true, providerMessageId: 'wa-123' });
  });

  it('retorna 404 si reserva no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    const result = await executeBookingCommunication('bk-999', { action: 'send_email', flow: 'PAYMENT' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  // ─── send_email ──────────────────────────────────────────────────────────

  it('send_email: envia email i crea adminLog', async () => {
    const result = await executeBookingCommunication('bk-1', { action: 'send_email', flow: 'PAYMENT' });

    expect(result.ok).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joan@example.com',
        subject: expect.stringContaining('OE-2026-001'),
      }),
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: 'bk-1',
        details: expect.objectContaining({ flow: 'PAYMENT', channel: 'email' }),
      }),
    });
  });

  it('send_email: subject en castellà si preferredLocale=es', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...BOOKING, preferredLocale: 'es' });
    await executeBookingCommunication('bk-1', { action: 'send_email', flow: 'PAYMENT' });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Recordatorio de pago'),
      }),
    );
  });

  it('send_email: subject en anglès si preferredLocale=en', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...BOOKING, preferredLocale: 'en' });
    await executeBookingCommunication('bk-1', { action: 'send_email', flow: 'PAYMENT' });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Payment reminder'),
      }),
    );
  });

  it('send_email POST_EVENT: subject de seguiment', async () => {
    await executeBookingCommunication('bk-1', { action: 'send_email', flow: 'POST_EVENT' });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('post-esdeveniment'),
      }),
    );
  });

  // ─── send_whatsapp ──────────────────────────────────────────────────────

  it('send_whatsapp: envia i crea adminLog amb providerMessageId', async () => {
    const result = await executeBookingCommunication('bk-1', { action: 'send_whatsapp', flow: 'GENERAL' });

    expect(result.ok).toBe(true);
    expect(mockSendWhatsAppText).toHaveBeenCalledOnce();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: expect.objectContaining({
          channel: 'whatsapp',
          providerMessageId: 'wa-123',
        }),
      }),
    });
  });

  it('send_whatsapp: retorna error si WhatsApp falla', async () => {
    mockSendWhatsAppText.mockResolvedValue({ ok: false, error: 'Rate limited' });
    const result = await executeBookingCommunication('bk-1', { action: 'send_whatsapp', flow: 'GENERAL' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(mockPrisma.adminLog.create).not.toHaveBeenCalled();
  });

  // ─── log_sent ──────────────────────────────────────────────────────────

  it('log_sent: registra COMM_SENT sense enviar res', async () => {
    const result = await executeBookingCommunication('bk-1', { action: 'log_sent', flow: 'PAYMENT', channel: 'email' });

    expect(result.ok).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockSendWhatsAppText).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledOnce();
  });

  it('log_sent: error si no hi ha canal', async () => {
    const result = await executeBookingCommunication('bk-1', { action: 'log_sent', flow: 'PAYMENT' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  // ─── mark_responded ──────────────────────────────────────────────────────

  it('mark_responded: registra COMM_RESPONDED', async () => {
    const result = await executeBookingCommunication('bk-1', { action: 'mark_responded', flow: 'PAYMENT' });

    expect(result.ok).toBe(true);
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'COMM_RESPONDED',
        details: { flow: 'PAYMENT' },
      }),
    });
  });
});
