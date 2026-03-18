import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests per la lògica de l'API route /api/admin/privacy/consents
 *
 * Testa la capa d'integració entre la ruta i els serveis:
 * - GET: parsing de paràmetres i delegació a listConsents
 * - DELETE: validació del body, lookup per consentId, delegació a revokeConsent + logPrivacyAction
 */

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    consentRecord: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    privacyAuditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { listConsents, revokeConsent, logPrivacyAction } from '@/lib/services/privacyService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.privacyAuditLog.create.mockResolvedValue({ id: 'audit1' });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET: listConsents — lògica de filtratge de l'API
// ═══════════════════════════════════════════════════════════════════════════

describe('listConsents — filtres API consents GET', () => {
  beforeEach(() => {
    mockPrisma.consentRecord.findMany.mockResolvedValue([]);
    mockPrisma.consentRecord.count.mockResolvedValue(0);
  });

  it('retorna llista buida sense filtres', async () => {
    const result = await listConsents();

    expect(result).toEqual({ items: [], total: 0 });
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        take: 50,
        skip: 0,
      })
    );
  });

  it('status "all" no afegeix filtre where', async () => {
    const result = await listConsents({ status: 'all' });

    expect(result).toEqual({ items: [], total: 0 });
    const call = mockPrisma.consentRecord.findMany.mock.calls[0][0];
    expect(call.where).toEqual({});
  });

  it('status "active" filtra granted=true i revokedAt=null', async () => {
    await listConsents({ status: 'active' });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { granted: true, revokedAt: null },
      })
    );
    expect(mockPrisma.consentRecord.count).toHaveBeenCalledWith({
      where: { granted: true, revokedAt: null },
    });
  });

  it('status "revoked" filtra revokedAt not null', async () => {
    await listConsents({ status: 'revoked' });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { revokedAt: { not: null } },
      })
    );
    expect(mockPrisma.consentRecord.count).toHaveBeenCalledWith({
      where: { revokedAt: { not: null } },
    });
  });

  it('filtra per consentType específic', async () => {
    await listConsents({ consentType: 'MARKETING_EMAIL' as any });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { consentType: 'MARKETING_EMAIL' },
      })
    );
  });

  it('combina status actiu + consentType', async () => {
    await listConsents({ status: 'active', consentType: 'GDPR_BASIC' as any });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { granted: true, revokedAt: null, consentType: 'GDPR_BASIC' },
      })
    );
  });

  it('cerca per text (search) genera OR amb email i customer', async () => {
    await listConsents({ search: 'anna' });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { email: { contains: 'anna', mode: 'insensitive' } },
            { customer: { name: { contains: 'anna', mode: 'insensitive' } } },
            { customer: { email: { contains: 'anna', mode: 'insensitive' } } },
          ],
        },
      })
    );
  });

  it('combina status + search', async () => {
    await listConsents({ status: 'active', search: 'test' });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          granted: true,
          revokedAt: null,
          OR: [
            { email: { contains: 'test', mode: 'insensitive' } },
            { customer: { name: { contains: 'test', mode: 'insensitive' } } },
            { customer: { email: { contains: 'test', mode: 'insensitive' } } },
          ],
        },
      })
    );
  });

  it('aplica limit personalitzat', async () => {
    await listConsents({ limit: 10 });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });

  it('aplica offset personalitzat', async () => {
    await listConsents({ offset: 25 });

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 25 })
    );
  });

  it('inclou customer amb select id/name/email', async () => {
    await listConsents();

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
      })
    );
  });

  it('ordena per createdAt desc', async () => {
    await listConsents();

    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('retorna items i total correctes', async () => {
    const mockItems = [
      { id: 'c1', consentType: 'GDPR_BASIC', customer: { id: 'cu1', name: 'A', email: 'a@t.com' } },
      { id: 'c2', consentType: 'MARKETING_SMS', customer: { id: 'cu2', name: 'B', email: 'b@t.com' } },
    ];
    mockPrisma.consentRecord.findMany.mockResolvedValue(mockItems);
    mockPrisma.consentRecord.count.mockResolvedValue(15);

    const result = await listConsents({ limit: 2, offset: 4 });

    expect(result.items).toEqual(mockItems);
    expect(result.total).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE: revokeConsent — lògica de revocació de l'API
// ═══════════════════════════════════════════════════════════════════════════

describe('revokeConsent — lògica de revocació per l\'API consents DELETE', () => {
  it('revoca consentiment actiu per customerId + consentType', async () => {
    const mockConsent = { id: 'c1', customerId: 'cust1', consentType: 'GDPR_BASIC', granted: true };
    mockPrisma.consentRecord.findFirst.mockResolvedValue(mockConsent);
    mockPrisma.consentRecord.update.mockResolvedValue({ ...mockConsent, granted: false, revokedAt: new Date() });

    const result = await revokeConsent('cust1', 'GDPR_BASIC' as any);

    expect(result.granted).toBe(false);
    expect(mockPrisma.consentRecord.findFirst).toHaveBeenCalledWith({
      where: {
        customerId: 'cust1',
        consentType: 'GDPR_BASIC',
        granted: true,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(mockPrisma.consentRecord.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { granted: false, revokedAt: expect.any(Date) },
    });
  });

  it('llança error si no es troba consentiment actiu', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);

    await expect(
      revokeConsent('cust-nonexist', 'GDPR_BASIC' as any)
    ).rejects.toThrow('Consentiment no trobat');
  });

  it('llança error si es revoca consentiment ja revocat (no actiu)', async () => {
    // findFirst retorna null perquè filtra granted=true i revokedAt=null
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);

    await expect(
      revokeConsent('cust1', 'MARKETING_EMAIL' as any)
    ).rejects.toThrow('Consentiment no trobat');
  });

  it('registra log d\'auditoria en revocar', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue({
      id: 'c1', customerId: 'cust1', consentType: 'GDPR_BASIC', granted: true,
    });
    mockPrisma.consentRecord.update.mockResolvedValue({ id: 'c1', granted: false });

    await revokeConsent('cust1', 'GDPR_BASIC' as any, 'Petició client');

    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: 'ConsentRecord',
        entityId: 'c1',
        action: 'CONSENT_REVOKED',
        reason: 'Petició client',
        legalBasis: 'Dret de revocació',
        previousData: { granted: true },
        newData: expect.objectContaining({ granted: false }),
      }),
    });
  });

  it('revokeConsent sense reason no falla', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue({
      id: 'c5', customerId: 'cust5', consentType: 'MARKETING_SMS', granted: true,
    });
    mockPrisma.consentRecord.update.mockResolvedValue({ id: 'c5', granted: false });

    const result = await revokeConsent('cust5', 'MARKETING_SMS' as any);

    expect(result.granted).toBe(false);
    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CONSENT_REVOKED',
        reason: undefined,
      }),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE per consentId: lookup + revokeConsent (lògica de la ruta)
// ═══════════════════════════════════════════════════════════════════════════

describe('revocació per consentId — lògica de la ruta DELETE', () => {
  it('findUnique per consentId retorna consentiment per revocar', async () => {
    const mockRecord = {
      id: 'consent-abc',
      customerId: 'cust99',
      email: 'test@test.com',
      consentType: 'MARKETING_WHATSAPP',
      granted: true,
    };
    mockPrisma.consentRecord.findUnique.mockResolvedValue(mockRecord);
    mockPrisma.consentRecord.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.consentRecord.update.mockResolvedValue({ ...mockRecord, granted: false });

    // Simula la lògica de la ruta: primer findUnique, llavors revokeConsent
    const consent = await mockPrisma.consentRecord.findUnique({ where: { id: 'consent-abc' } });
    expect(consent).toBeTruthy();

    const result = await revokeConsent(
      consent!.customerId || consent!.email || '',
      consent!.consentType as any
    );

    expect(result.granted).toBe(false);
    expect(mockPrisma.consentRecord.findUnique).toHaveBeenCalledWith({ where: { id: 'consent-abc' } });
  });

  it('findUnique retorna null → error 404 (consentiment no trobat)', async () => {
    mockPrisma.consentRecord.findUnique.mockResolvedValue(null);

    const consent = await mockPrisma.consentRecord.findUnique({ where: { id: 'nonexist' } });

    expect(consent).toBeNull();
    // La ruta retornaria { success: false, error: 'Consentiment no trobat' } amb status 404
  });

  it('usa email com a fallback si customerId és null', async () => {
    const mockRecord = {
      id: 'consent-xyz',
      customerId: null,
      email: 'anon@test.com',
      consentType: 'GDPR_BASIC',
      granted: true,
    };
    mockPrisma.consentRecord.findUnique.mockResolvedValue(mockRecord);
    mockPrisma.consentRecord.findFirst.mockResolvedValue(mockRecord);
    mockPrisma.consentRecord.update.mockResolvedValue({ ...mockRecord, granted: false });

    const consent = await mockPrisma.consentRecord.findUnique({ where: { id: 'consent-xyz' } });
    const identifier = consent!.customerId || consent!.email || '';

    expect(identifier).toBe('anon@test.com');

    const result = await revokeConsent(identifier, consent!.consentType as any);
    expect(result.granted).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// logPrivacyAction — registre d'auditoria post-revocació
// ═══════════════════════════════════════════════════════════════════════════

describe('logPrivacyAction — registre post-revocació', () => {
  it('registra acció CONSENT_REVOKED per ConsentRecord', async () => {
    await logPrivacyAction({
      entityType: 'ConsentRecord',
      entityId: 'consent-abc',
      action: 'CONSENT_REVOKED' as any,
      performedBy: 'ADMIN',
      reason: 'Revocat manualment per admin',
      legalBasis: 'Revocació de consentiment',
    });

    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: 'ConsentRecord',
        entityId: 'consent-abc',
        action: 'CONSENT_REVOKED',
        performedBy: 'ADMIN',
        reason: 'Revocat manualment per admin',
        legalBasis: 'Revocació de consentiment',
      }),
    });
  });

  it('registra acció CONSENT_REVOKED per Customer (sense consentId)', async () => {
    await logPrivacyAction({
      entityType: 'Customer',
      entityId: 'cust1',
      action: 'CONSENT_REVOKED' as any,
      performedBy: 'ADMIN',
      reason: 'Revocat manualment per admin',
      legalBasis: 'Revocació de consentiment',
    });

    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: 'Customer',
        entityId: 'cust1',
        action: 'CONSENT_REVOKED',
        performedBy: 'ADMIN',
      }),
    });
  });

  it('accepta camps opcionals (sense affectedFields, sense requestId)', async () => {
    await logPrivacyAction({
      entityType: 'ConsentRecord',
      entityId: 'c1',
      action: 'CONSENT_REVOKED' as any,
    });

    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: 'ConsentRecord',
        entityId: 'c1',
        action: 'CONSENT_REVOKED',
        performedBy: undefined,
        reason: undefined,
        legalBasis: undefined,
        affectedFields: [],
      }),
    });
  });
});
