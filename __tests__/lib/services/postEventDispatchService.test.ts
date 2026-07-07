import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockGetBookingQuestionnaire, mockIssueClientPortalAccess } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockSendEmail: vi.fn(),
  mockGetBookingQuestionnaire: vi.fn(),
  mockIssueClientPortalAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: { phone: '+34600000000', email: 'info@test.com' },
    reviews: { googleReviewUrl: 'https://google.com/review' },
  },
}));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: () => 'https://test.orbita.events' }));
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>();
  return {
    ...actual,
    PLACEHOLDER_EMAIL_DOMAIN: '@placeholder.orbita',
    toIntlLocale: (l: string) => l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES',
  };
});
vi.mock('@/lib/services/postEventEmailService', () => ({
  normalizeLocale: (l: string) => l || 'ca',
  resolvePackName: () => 'Premium',
  getPostEventSubject: () => 'Subject',
  generatePostEventEmail: () => '<html>email</html>',
}));
vi.mock('@/lib/services/customerActivityService', () => ({
  recordCustomerPostEventEmailSent: vi.fn(),
}));
vi.mock('@/lib/services/bookingCommunicationLogService', () => ({
  recordBookingCommunicationLog: vi.fn(),
}));
vi.mock('@/lib/services/questionnaireService', () => ({
  getBookingQuestionnaire: mockGetBookingQuestionnaire,
}));
vi.mock('@/lib/services/clientPortalAccess', () => ({
  issueClientPortalAccess: mockIssueClientPortalAccess,
}));

import {
  buildPostEventReviewUrl,
  listPendingPostEventBookings,
  sendPostEventEmailForBooking,
} from '@/lib/services/postEventDispatchService';
import { recordCustomerPostEventEmailSent } from '@/lib/services/customerActivityService';
import { recordBookingCommunicationLog } from '@/lib/services/bookingCommunicationLogService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.booking.update.mockResolvedValue({});
  mockSendEmail.mockResolvedValue({});
  mockGetBookingQuestionnaire.mockResolvedValue(null);
  mockIssueClientPortalAccess.mockResolvedValue({ url: 'https://test.orbita.events/ca/portal/token' });
});

describe('listPendingPostEventBookings', () => {
  it('retorna reserves pendents', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([{ id: 'b1' }]);

    const result = await listPendingPostEventBookings();

    expect(result).toHaveLength(1);
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'COMPLETED',
          postEventEmailSent: false,
        }),
      })
    );
  });
});

describe('buildPostEventReviewUrl', () => {
  it('codifica token i referencia amb URLSearchParams', () => {
    const reviewUrl = buildPostEventReviewUrl({
      baseUrl: 'https://test.orbita.events',
      locale: 'ca',
      reviewToken: 'tok+1/2',
      bookingReference: 'OE-2026-ABCD/42',
    });

    const parsed = new URL(reviewUrl);
    expect(parsed.pathname).toBe('/ca/valoracio');
    expect(parsed.searchParams.get('token')).toBe('tok+1/2');
    expect(parsed.searchParams.get('ref')).toBe('OE-2026-ABCD/42');
    expect(reviewUrl).toContain('token=tok%2B1%2F2');
    expect(reviewUrl).toContain('ref=OE-2026-ABCD%2F42');
  });
});

describe('sendPostEventEmailForBooking', () => {
  it('retorna error si reserva no existeix', async () => {
    const result = await sendPostEventEmailForBooking('b-inexistent');

    expect(result.status).toBe('error');
  });

  it('salta si no COMPLETED', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'CONFIRMED',
      clientName: 'Maria',
      clientEmail: 'maria@test.com',
      reference: 'REF-001',
    });

    const result = await sendPostEventEmailForBooking('b1');

    expect(result.status).toBe('skipped');
  });

  it('salta si ja enviat', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'COMPLETED',
      clientName: 'Maria',
      clientEmail: 'maria@test.com',
      postEventEmailSent: true,
      reference: 'REF-001',
    });

    const result = await sendPostEventEmailForBooking('b1');

    expect(result.status).toBe('skipped');
  });

  it('salta si email placeholder', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'COMPLETED',
      clientName: 'Maria',
      clientEmail: 'auto@placeholder.orbita',
      postEventEmailSent: false,
      reference: 'REF-001',
    });

    const result = await sendPostEventEmailForBooking('b1');

    expect(result.status).toBe('skipped');
  });

  it('envia email correctament', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'COMPLETED',
      clientName: 'Maria',
      clientEmail: 'maria@test.com',
      postEventEmailSent: false,
      reference: 'REF-001',
      eventDate: new Date(),
      preferredLocale: 'ca',
      lead: { preferredLocale: 'ca', customerId: 'cust1' },
      pack: { translations: [{ locale: 'ca', name: 'Premium' }] },
    });

    const result = await sendPostEventEmailForBooking('b1');

    expect(result.status).toBe('sent');
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ postEventEmailSent: true }),
      })
    );
  });

  it('registra POST_EVENT_EMAIL_SENT via capa shared si customer linked', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'COMPLETED',
      clientName: 'Maria',
      clientEmail: 'maria@test.com',
      postEventEmailSent: false,
      reference: 'REF-001',
      eventDate: new Date(),
      preferredLocale: 'ca',
      lead: { preferredLocale: 'ca', customerId: 'cust1' },
      pack: null,
    });

    await sendPostEventEmailForBooking('b1');

    expect(recordCustomerPostEventEmailSent).toHaveBeenCalledWith({
      customerId: 'cust1',
      bookingId: 'b1',
      bookingRef: 'REF-001',
    });
  });

  it('registra adminLog shared si opció activada', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'COMPLETED',
      clientName: 'Maria',
      clientEmail: 'maria@test.com',
      postEventEmailSent: false,
      reference: 'REF-001',
      eventDate: new Date(),
      preferredLocale: 'ca',
      lead: null,
      pack: null,
    });

    await sendPostEventEmailForBooking('b1', { createAdminLog: true });

    expect(recordBookingCommunicationLog).toHaveBeenCalledWith({
      action: 'SEND_POST_EVENT_EMAIL',
      bookingId: 'b1',
      details: { email: 'maria@test.com', reference: 'REF-001' },
    });
  });
});
