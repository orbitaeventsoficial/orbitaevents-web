import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    clientPortalAccess: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: () => 'https://orbitaevents.com' }));

import {
  normalizePortalLocale,
  getActivePortalAccessForBooking,
  issueClientPortalAccess,
  revokeActiveClientPortalAccess,
  findPortalAccessByRawToken,
  markPortalAccessHit,
} from '@/lib/services/clientPortalAccess';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.clientPortalAccess.findFirst.mockResolvedValue(null);
  mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(null);
  mockPrisma.clientPortalAccess.create.mockResolvedValue({
    id: 'access-1',
    tokenPrefix: 'abc123',
    locale: 'ca',
    personalization: null,
    expiresAt: new Date('2026-04-01'),
    createdAt: new Date(),
    createdBy: null,
    lastAccessedAt: null,
  });
  mockPrisma.clientPortalAccess.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.clientPortalAccess.update.mockResolvedValue({});
  mockPrisma.booking.findUnique.mockResolvedValue({
    id: 'booking-1',
    customerId: 'cust-1',
    preferredLocale: 'ca',
  });
});

// ─────────────────────────────────────────────────────────────────────────
// normalizePortalLocale (pure)
// ─────────────────────────────────────────────────────────────────────────
describe('normalizePortalLocale', () => {
  it('retorna ca per defecte', () => {
    expect(normalizePortalLocale(null)).toBe('ca');
    expect(normalizePortalLocale(undefined)).toBe('ca');
    expect(normalizePortalLocale('')).toBe('ca');
  });

  it('retorna ca per locale invàlid', () => {
    expect(normalizePortalLocale('fr')).toBe('ca');
    expect(normalizePortalLocale('de')).toBe('ca');
  });

  it('accepta ca/es/en', () => {
    expect(normalizePortalLocale('ca')).toBe('ca');
    expect(normalizePortalLocale('es')).toBe('es');
    expect(normalizePortalLocale('en')).toBe('en');
  });

  it('normalitza majúscules', () => {
    expect(normalizePortalLocale('CA')).toBe('ca');
    expect(normalizePortalLocale('ES')).toBe('es');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// issueClientPortalAccess
// ─────────────────────────────────────────────────────────────────────────
describe('issueClientPortalAccess', () => {
  it('llança error si booking no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    await expect(issueClientPortalAccess({ bookingId: 'fake' })).rejects.toThrow('BOOKING_NOT_FOUND');
  });

  it('revoca accessos anteriors', async () => {
    await issueClientPortalAccess({ bookingId: 'booking-1' });

    expect(mockPrisma.clientPortalAccess.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ bookingId: 'booking-1', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    );
  });

  it('només considera actius els accessos amb caducitat futura', async () => {
    await getActivePortalAccessForBooking('booking-1');

    expect(mockPrisma.clientPortalAccess.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bookingId: 'booking-1',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
      })
    );
  });

  it('crea nou accés i retorna token + url', async () => {
    const result = await issueClientPortalAccess({ bookingId: 'booking-1' });

    expect(result.access).toBeDefined();
    expect(result.token).toBeTruthy();
    expect(result.url).toContain('https://orbitaevents.com/ca/portal/');
  });

  it('usa locale del booking si no s\'especifica', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      customerId: 'cust-1',
      preferredLocale: 'es',
    });

    await issueClientPortalAccess({ bookingId: 'booking-1' });

    expect(mockPrisma.clientPortalAccess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locale: 'es' }),
      })
    );
  });

  it('usa locale explícit si es proporciona', async () => {
    await issueClientPortalAccess({ bookingId: 'booking-1', locale: 'en' });

    expect(mockPrisma.clientPortalAccess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locale: 'en' }),
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// revokeActiveClientPortalAccess
// ─────────────────────────────────────────────────────────────────────────
describe('revokeActiveClientPortalAccess', () => {
  it('retorna nombre d\'accessos revocats', async () => {
    mockPrisma.clientPortalAccess.updateMany.mockResolvedValue({ count: 2 });

    const result = await revokeActiveClientPortalAccess('booking-1');

    expect(result).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// findPortalAccessByRawToken
// ─────────────────────────────────────────────────────────────────────────
describe('findPortalAccessByRawToken', () => {
  it('retorna null per token curt', async () => {
    const result = await findPortalAccessByRawToken('short');
    expect(result).toBeNull();
  });

  it('retorna null per token buit', async () => {
    const result = await findPortalAccessByRawToken('');
    expect(result).toBeNull();
  });

  it('retorna null si no trobat', async () => {
    const result = await findPortalAccessByRawToken('a'.repeat(30));
    expect(result).toBeNull();
  });

  it('retorna null si revocat', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue({
      revokedAt: new Date(),
      expiresAt: new Date('2027-01-01'),
    });

    const result = await findPortalAccessByRawToken('a'.repeat(30));
    expect(result).toBeNull();
  });

  it('retorna null si expirat', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue({
      revokedAt: null,
      expiresAt: new Date('2020-01-01'),
    });

    const result = await findPortalAccessByRawToken('a'.repeat(30));
    expect(result).toBeNull();
  });

  it('retorna null si el token legacy no té caducitat', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue({
      revokedAt: null,
      expiresAt: null,
    });

    const result = await findPortalAccessByRawToken('a'.repeat(30));
    expect(result).toBeNull();
  });

  it('retorna accés vàlid', async () => {
    const access = {
      id: 'access-1',
      revokedAt: null,
      expiresAt: new Date('2027-01-01'),
      booking: { id: 'booking-1' },
    };
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(access);

    const result = await findPortalAccessByRawToken('a'.repeat(30));
    expect(result).toBeTruthy();
    expect(result!.id).toBe('access-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// markPortalAccessHit
// ─────────────────────────────────────────────────────────────────────────
describe('markPortalAccessHit', () => {
  it('actualitza lastAccessedAt', async () => {
    await markPortalAccessHit({ accessId: 'access-1', ip: '1.2.3.4', userAgent: 'Chrome' });

    expect(mockPrisma.clientPortalAccess.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'access-1' },
        data: expect.objectContaining({
          lastAccessedAt: expect.any(Date),
          lastAccessIp: '1.2.3.4',
          lastAccessUa: 'Chrome',
        }),
      })
    );
  });

  it('no llança error si update falla', async () => {
    mockPrisma.clientPortalAccess.update.mockRejectedValue(new Error('DB error'));

    // Should not throw
    await markPortalAccessHit({ accessId: 'access-1' });
  });
});
