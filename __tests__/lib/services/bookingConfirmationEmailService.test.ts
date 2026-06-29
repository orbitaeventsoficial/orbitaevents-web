import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetTemplate, mockSendEmail } = vi.hoisted(() => ({
  mockPrisma: { packTranslation: { findUnique: vi.fn() } },
  mockGetTemplate: vi.fn(),
  mockSendEmail: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/emailTemplateService', () => ({ getTemplate: mockGetTemplate }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));

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
  mockPrisma.packTranslation.findUnique.mockResolvedValue({ name: 'VIP Experience' });
  mockGetTemplate.mockResolvedValue({ subject: 'Reserva OE-2026-001', bodyHtml: '<p>ok</p>', source: 'db' });
  mockSendEmail.mockResolvedValue({ ok: true });
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

  it('normalitza el locale (ca/en vàlids, la resta → es)', async () => {
    await sendBookingConfirmationEmail({ ...BASE, locale: 'en' });
    expect(mockGetTemplate).toHaveBeenCalledWith('booking_confirmation', 'en', expect.anything());
  });
});
