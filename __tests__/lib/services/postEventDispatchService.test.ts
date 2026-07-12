import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockSendEmail,
  mockGetBookingQuestionnaire,
  mockIssueClientPortalAccess,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
} = vi.hoisted(() => ({
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
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
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
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
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
  mockSendEmail.mockResolvedValue({
    ok: true,
    smtp: { accepted: ['maria@test.com'], rejected: [], response: '250 OK', messageId: '<post-event@test>' },
    imapSent: { attempted: true, ok: true, folder: 'Sent', uid: 91 },
    orbitaMessageId: '<orbita.lead.lead1.a.b@orbitaevents.com>',
  });
  mockGetBookingQuestionnaire.mockResolvedValue(null);
  mockIssueClientPortalAccess.mockResolvedValue({ url: 'https://test.orbita.events/ca/portal/token' });
  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-post-1', trackingToken: 'post-token-1' });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
  mockWrapLinksForTracking.mockImplementation((html: string, token: string) => `${html}<a href="/tracked/${token}">tracked</a>`);
});

describe('listPendingPostEventBookings', () => {
  it('retorna reserves pendents dins la finestra canònica de catch-up', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([{ id: 'b1' }]);

    const now = new Date('2026-07-11T10:00:00.000Z');
    const result = await listPendingPostEventBookings(now);

    expect(result).toHaveLength(1);
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'COMPLETED',
          postEventEmailSent: false,
          eventDate: {
            gte: new Date('2026-04-12T10:00:00.000Z'),
            lte: new Date('2026-07-09T10:00:00.000Z'),
          },
          clientEmail: { not: { contains: '@placeholder.orbita' } },
        }),
        select: expect.objectContaining({
          id: true,
          reference: true,
          eventDate: true,
          pack: { select: { translations: true } },
        }),
        orderBy: { eventDate: 'desc' },
        take: 50,
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
      lead: { id: 'lead1', preferredLocale: 'ca', customerId: 'cust1' },
      pack: { translations: [{ locale: 'ca', name: 'Premium' }] },
    });

    const result = await sendPostEventEmailForBooking('b1');

    expect(result.status).toBe('sent');
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'maria@test.com',
      subject: 'Subject',
      templateKey: 'post-event',
      leadId: 'lead1',
      customerId: 'cust1',
      locale: 'ca',
      htmlBody: '<html>email</html>',
      orbitaKind: 'lead',
      orbitaId: 'lead1',
      orbitaOrigin: 'post-event-dispatch',
    }));
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'maria@test.com',
      subject: 'Subject',
      html: expect.stringContaining('/api/tracking/open/post-token-1'),
      orbita: { kind: 'lead', id: 'lead1', origin: 'post-event-dispatch' },
    }));
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-post-1', expect.objectContaining({
      smtpAccepted: ['maria@test.com'],
      smtpRejected: [],
      smtpResponse: '250 OK',
      smtpMessageId: '<post-event@test>',
      imapAppendOk: true,
      imapSentFolder: 'Sent',
      imapSentUid: 91,
      imapError: null,
    }));
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
      lead: { id: 'lead1', preferredLocale: 'ca', customerId: 'cust1' },
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
      details: expect.objectContaining({
        email: 'maria@test.com',
        reference: 'REF-001',
        emailSendId: 'email-send-post-1',
        emailSnapshot: 'EmailSend.htmlBody',
        orbitaKind: 'booking',
        orbitaId: 'b1',
        orbitaOrigin: 'post-event-dispatch',
      }),
    });
  });

  it('no envia ni marca postEventEmailSent si no pot crear EmailSend', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      status: 'COMPLETED',
      clientName: 'Maria',
      clientEmail: 'maria@test.com',
      postEventEmailSent: false,
      reference: 'REF-001',
      eventDate: new Date(),
      preferredLocale: 'ca',
      lead: { id: 'lead1', preferredLocale: 'ca', customerId: 'cust1' },
      pack: null,
    });
    mockRecordEmailSend.mockRejectedValueOnce(new Error('tracking KO'));

    await expect(sendPostEventEmailForBooking('b1')).rejects.toThrow('tracking KO');

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });
});
