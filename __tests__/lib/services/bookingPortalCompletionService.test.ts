import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockIssueAccess,
  mockGetActiveAccess,
  mockSendEmail,
  mockIsSmtpConfigured,
  mockLogError,
  mockGetAppBaseUrl,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
} = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: { create: vi.fn() },
  },
  mockIssueAccess: vi.fn(),
  mockGetActiveAccess: vi.fn(),
  mockSendEmail: vi.fn(),
  mockIsSmtpConfigured: vi.fn(),
  mockLogError: vi.fn(),
  mockGetAppBaseUrl: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: mockLogError } }));
vi.mock('@/lib/services/clientPortalAccess', () => ({
  issueClientPortalAccess: mockIssueAccess,
  getActivePortalAccessForBooking: mockGetActiveAccess,
}));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/env', () => ({ isSmtpConfigured: mockIsSmtpConfigured }));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: mockGetAppBaseUrl }));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
}));
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>();
  return { ...actual, PLACEHOLDER_EMAIL_DOMAIN: '@placeholder.orbitaevents.com' };
});

import { tryEnsureCompletedBookingPortalAccess } from '@/lib/services/bookingPortalCompletionService';

beforeEach(() => {
  vi.clearAllMocks();
  mockIsSmtpConfigured.mockReturnValue(true);
  mockGetActiveAccess.mockResolvedValue(null);
  mockIssueAccess.mockResolvedValue({
    access: { id: 'access-1' },
    token: 'test-token',
    url: 'https://orbitaevents.com/ca/portal/test-token',
  });
  mockGetAppBaseUrl.mockReturnValue('https://orbitaevents.com/');
  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-portal-1', trackingToken: 'portal-token-1' });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
  mockWrapLinksForTracking.mockImplementation((html: string, token: string) => `${html}<a href="/tracked/${token}">tracked</a>`);
  mockSendEmail.mockResolvedValue({
    ok: true,
    smtp: { accepted: ['maria@test.com'], rejected: [], response: '250 OK', messageId: '<portal@test>' },
    imapSent: { attempted: true, ok: true, folder: 'Sent', uid: 31 },
    orbitaMessageId: '<orbita.booking.booking-1.a.b@orbitaevents.com>',
  });
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('tryEnsureCompletedBookingPortalAccess', () => {
  const BASE_OPTIONS = {
    bookingId: 'booking-1',
    clientEmail: 'maria@test.com',
    clientName: 'Maria',
    trigger: 'status-change',
  };

  it('crea accés portal si no existeix', async () => {
    const result = await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(result.created).toBe(true);
    if (result.created) expect(result.url).toContain('portal');
    expect(mockIssueAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: 'booking-1',
        createdBy: 'system:auto-completed',
      })
    );
  });

  it('no crea si ja existeix accés actiu', async () => {
    mockGetActiveAccess.mockResolvedValue({ id: 'existing' });

    const result = await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(result.created).toBe(false);
    if (!result.created) expect(result.skipped).toBe('already_exists');
    expect(mockIssueAccess).not.toHaveBeenCalled();
  });

  it('envia email amb link portal', async () => {
    await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@test.com',
        subject: expect.stringContaining('portal'),
        html: expect.stringContaining('/api/tracking/open/portal-token-1'),
        orbita: { kind: 'booking', id: 'booking-1', origin: 'booking-portal-completion' },
      })
    );
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'booking-portal-access',
      to: 'maria@test.com',
      subject: expect.stringContaining('portal'),
      leadId: null,
      customerId: null,
      locale: 'ca',
      htmlBody: expect.stringContaining('https://orbitaevents.com/ca/portal/test-token'),
      orbitaKind: 'booking',
      orbitaId: 'booking-1',
      orbitaOrigin: 'booking-portal-completion',
    }));
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-portal-1', expect.objectContaining({
      smtpAccepted: ['maria@test.com'],
      smtpRejected: [],
      smtpResponse: '250 OK',
      smtpMessageId: '<portal@test>',
      imapAppendOk: true,
      imapSentFolder: 'Sent',
      imapSentUid: 31,
      imapError: null,
    }));
  });

  it('no envia email si adreça és placeholder', async () => {
    await tryEnsureCompletedBookingPortalAccess({
      ...BASE_OPTIONS,
      clientEmail: 'imported@placeholder.orbitaevents.com',
    });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('no envia email si clientEmail null', async () => {
    await tryEnsureCompletedBookingPortalAccess({
      ...BASE_OPTIONS,
      clientEmail: null,
    });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('marca email skipped si SMTP no està configurat sense convertir el portal en error', async () => {
    mockIsSmtpConfigured.mockReturnValue(false);

    const result = await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(result.created).toBe(true);
    if (result.created) expect(result.emailStatus).toBe('smtp_not_configured');
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: expect.objectContaining({
          emailStatus: 'smtp_not_configured',
          clientEmail: 'maria@test.com',
        }),
      }),
    });
  });

  it('conserva el portal creat si falla només l email', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(result.created).toBe(true);
    if (result.created) expect(result.emailStatus).toBe('failed');
    expect(mockRecordEmailSend).toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalledWith(
      'Auto portal email failed',
      expect.any(Error),
      expect.objectContaining({ context: expect.objectContaining({ bookingId: 'booking-1' }) }),
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: expect.objectContaining({ emailStatus: 'failed' }),
      }),
    });
  });

  it('conserva el portal creat però no envia SMTP si falla EmailSend', async () => {
    mockRecordEmailSend.mockRejectedValueOnce(new Error('tracking KO'));

    const result = await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(result.created).toBe(true);
    if (result.created) expect(result.emailStatus).toBe('failed');
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: expect.objectContaining({ emailStatus: 'failed' }),
      }),
    });
  });

  it('crea adminLog', async () => {
    await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'PORTAL_AUTO_CREATED',
        entity: 'booking',
        entityId: 'booking-1',
        details: expect.objectContaining({
          emailSendId: 'email-send-portal-1',
          emailSnapshot: 'EmailSend.htmlBody',
          orbitaKind: 'booking',
          orbitaId: 'booking-1',
          orbitaOrigin: 'booking-portal-completion',
        }),
      }),
    });
  });

  it('subject en català per defecte', async () => {
    await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("portal d'accés"),
      })
    );
  });

  it('subject en castellà', async () => {
    await tryEnsureCompletedBookingPortalAccess({
      ...BASE_OPTIONS,
      preferredLocale: 'es',
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('portal de acceso'),
      })
    );
  });

  it('subject en anglès', async () => {
    await tryEnsureCompletedBookingPortalAccess({
      ...BASE_OPTIONS,
      preferredLocale: 'en',
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('access portal'),
      })
    );
  });

  it('retorna error sense petar si issueAccess falla', async () => {
    mockIssueAccess.mockRejectedValue(new Error('DB error'));

    const result = await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(result.created).toBe(false);
    if (!result.created) expect(result.skipped).toBe('error');
  });
});
