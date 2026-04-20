import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockIssueAccess, mockGetActiveAccess, mockSendEmail } = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: { create: vi.fn() },
  },
  mockIssueAccess: vi.fn(),
  mockGetActiveAccess: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/clientPortalAccess', () => ({
  issueClientPortalAccess: mockIssueAccess,
  getActivePortalAccessForBooking: mockGetActiveAccess,
}));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>();
  return { ...actual, PLACEHOLDER_EMAIL_DOMAIN: '@placeholder.orbitaevents.com' };
});

import { tryEnsureCompletedBookingPortalAccess } from '@/lib/services/bookingPortalCompletionService';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetActiveAccess.mockResolvedValue(null);
  mockIssueAccess.mockResolvedValue({
    access: { id: 'access-1' },
    token: 'test-token',
    url: 'https://orbitaevents.com/ca/portal/test-token',
  });
  mockSendEmail.mockResolvedValue({});
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
      })
    );
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

  it('crea adminLog', async () => {
    await tryEnsureCompletedBookingPortalAccess(BASE_OPTIONS);

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'PORTAL_AUTO_CREATED',
        entity: 'booking',
        entityId: 'booking-1',
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
