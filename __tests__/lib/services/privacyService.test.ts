import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    consentRecord: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    dataRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    customerTestimonial: { deleteMany: vi.fn() },
    customerActivity: { deleteMany: vi.fn() },
    lead: { findMany: vi.fn(), delete: vi.fn(), update: vi.fn() },
    privacyAuditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    legalDocument: { findFirst: vi.fn() },
    dataRetentionPolicy: { findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  recordConsent,
  revokeConsent,
  getActiveConsents,
  hasActiveConsent,
  listConsents,
  createDataRequest,
  verifyDataRequest,
  processDataRequest,
  getPendingDataRequests,
  getUrgentDataRequests,
  logPrivacyAction,
  getAuditHistory,
  getAuditSummary,
  getActiveLegalDocument,
  getCurrentLegalVersion,
  exportCustomerData,
  anonymizeCustomerData,
  executeRetentionPolicies,
  getPrivacyStats,
  checkGdprCompliance,
} from '@/lib/services/privacyService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.privacyAuditLog.create.mockResolvedValue({ id: 'audit1' });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONSENTIMENTS
// ═══════════════════════════════════════════════════════════════════════════

describe('recordConsent', () => {
  it('crea consentiment i log d\'auditoria', async () => {
    const consent = { id: 'c1', consentType: 'GDPR_BASIC', granted: true };
    mockPrisma.consentRecord.create.mockResolvedValue(consent);

    const result = await recordConsent({
      email: 'test@test.com',
      consentType: 'GDPR_BASIC' as any,
      consentVersion: '1.0',
      granted: true,
      source: 'web',
    });

    expect(result).toEqual(consent);
    expect(mockPrisma.consentRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@test.com',
        consentType: 'GDPR_BASIC',
        granted: true,
        grantedAt: expect.any(Date),
      }),
    });
    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'CONSENT_GRANTED' }),
    });
  });

  it('registra revocació amb grantedAt null', async () => {
    mockPrisma.consentRecord.create.mockResolvedValue({ id: 'c2', granted: false });

    await recordConsent({
      email: 'test@test.com',
      consentType: 'MARKETING_EMAIL' as any,
      consentVersion: '1.0',
      granted: false,
      source: 'web',
    });

    expect(mockPrisma.consentRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ granted: false, grantedAt: null }),
    });
    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'CONSENT_REVOKED' }),
    });
  });
});

describe('revokeConsent', () => {
  it('revoca consentiment actiu', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue({ id: 'c1', granted: true });
    mockPrisma.consentRecord.update.mockResolvedValue({ id: 'c1', granted: false });

    const result = await revokeConsent('cust1', 'GDPR_BASIC' as any);

    expect(result.granted).toBe(false);
    expect(mockPrisma.consentRecord.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { granted: false, revokedAt: expect.any(Date) },
    });
  });

  it('llança error si no hi ha consentiment', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);

    await expect(revokeConsent('cust1', 'GDPR_BASIC' as any)).rejects.toThrow('Consentiment no trobat');
  });
});

describe('getActiveConsents', () => {
  it('retorna consentiments actius', async () => {
    const consents = [{ id: 'c1', consentType: 'GDPR_BASIC' }];
    mockPrisma.consentRecord.findMany.mockResolvedValue(consents);

    const result = await getActiveConsents('cust1');

    expect(result).toEqual(consents);
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith({
      where: { customerId: 'cust1', granted: true, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('hasActiveConsent', () => {
  it('retorna true si existeix consentiment', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue({ id: 'c1' });

    expect(await hasActiveConsent('cust1', 'GDPR_BASIC' as any)).toBe(true);
  });

  it('retorna false si no existeix', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);

    expect(await hasActiveConsent('cust1', 'GDPR_BASIC' as any)).toBe(false);
  });

  it('cerca per email o customerId', async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);

    await hasActiveConsent('test@test.com', 'GDPR_BASIC' as any);

    expect(mockPrisma.consentRecord.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ customerId: 'test@test.com' }, { email: 'test@test.com' }],
        consentType: 'GDPR_BASIC',
        granted: true,
        revokedAt: null,
      },
    });
  });
});

describe('listConsents', () => {
  const mockItems = [
    { id: 'c1', consentType: 'GDPR_BASIC', granted: true, revokedAt: null, customer: { id: 'cust1', name: 'Anna', email: 'anna@test.com' } },
    { id: 'c2', consentType: 'MARKETING_EMAIL', granted: true, revokedAt: null, customer: { id: 'cust2', name: 'Berta', email: 'berta@test.com' } },
  ];

  it('llista tots els consentiments amb opcions per defecte', async () => {
    mockPrisma.consentRecord.findMany.mockResolvedValue(mockItems);
    mockPrisma.consentRecord.count.mockResolvedValue(2);

    const result = await listConsents();

    expect(result).toEqual({ items: mockItems, total: 2 });
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      skip: 0,
    });
    expect(mockPrisma.consentRecord.count).toHaveBeenCalledWith({ where: {} });
  });

  it('filtra consentiments actius', async () => {
    mockPrisma.consentRecord.findMany.mockResolvedValue([mockItems[0]]);
    mockPrisma.consentRecord.count.mockResolvedValue(1);

    const result = await listConsents({ status: 'active' });

    expect(result).toEqual({ items: [mockItems[0]], total: 1 });
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { granted: true, revokedAt: null },
      }),
    );
    expect(mockPrisma.consentRecord.count).toHaveBeenCalledWith({
      where: { granted: true, revokedAt: null },
    });
  });

  it('filtra consentiments revocats', async () => {
    mockPrisma.consentRecord.findMany.mockResolvedValue([]);
    mockPrisma.consentRecord.count.mockResolvedValue(0);

    const result = await listConsents({ status: 'revoked' });

    expect(result).toEqual({ items: [], total: 0 });
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { revokedAt: { not: null } },
      }),
    );
    expect(mockPrisma.consentRecord.count).toHaveBeenCalledWith({
      where: { revokedAt: { not: null } },
    });
  });

  it('filtra per tipus de consentiment', async () => {
    mockPrisma.consentRecord.findMany.mockResolvedValue([mockItems[0]]);
    mockPrisma.consentRecord.count.mockResolvedValue(1);

    const result = await listConsents({ consentType: 'GDPR_BASIC' as any });

    expect(result).toEqual({ items: [mockItems[0]], total: 1 });
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { consentType: 'GDPR_BASIC' },
      }),
    );
  });

  it('cerca per nom o email del client', async () => {
    mockPrisma.consentRecord.findMany.mockResolvedValue([mockItems[0]]);
    mockPrisma.consentRecord.count.mockResolvedValue(1);

    const result = await listConsents({ search: 'anna' });

    expect(result).toEqual({ items: [mockItems[0]], total: 1 });
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { email: { contains: 'anna', mode: 'insensitive' } },
            { customer: { name: { contains: 'anna', mode: 'insensitive' } } },
            { customer: { email: { contains: 'anna', mode: 'insensitive' } } },
          ],
        },
      }),
    );
  });

  it('aplica paginació amb limit i offset', async () => {
    mockPrisma.consentRecord.findMany.mockResolvedValue([mockItems[1]]);
    mockPrisma.consentRecord.count.mockResolvedValue(2);

    const result = await listConsents({ limit: 1, offset: 1 });

    expect(result).toEqual({ items: [mockItems[1]], total: 2 });
    expect(mockPrisma.consentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1,
        skip: 1,
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SOL·LICITUDS DE DRETS (ARCO)
// ═══════════════════════════════════════════════════════════════════════════

describe('createDataRequest', () => {
  it('crea sol·licitud amb deadline 30 dies', async () => {
    mockPrisma.customer.findFirst.mockResolvedValue({ id: 'cust1' });
    mockPrisma.dataRequest.create.mockResolvedValue({ id: 'req1', status: 'PENDING' });

    const result = await createDataRequest({
      requesterEmail: 'test@test.com',
      requesterName: 'Test',
      requestType: 'ACCESS' as any,
    });

    expect(result.status).toBe('PENDING');
    expect(mockPrisma.dataRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust1',
        requesterEmail: 'test@test.com',
        status: 'PENDING',
        verificationToken: expect.any(String),
      }),
    });
  });

  it('funciona sense client associat', async () => {
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    mockPrisma.dataRequest.create.mockResolvedValue({ id: 'req2' });

    await createDataRequest({
      requesterEmail: 'extern@test.com',
      requesterName: 'Extern',
      requestType: 'ACCESS' as any,
    });

    expect(mockPrisma.dataRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ customerId: undefined }),
    });
  });
});

describe('verifyDataRequest', () => {
  it('verifica sol·licitud amb token', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({ id: 'req1', verifiedAt: null });
    mockPrisma.dataRequest.update.mockResolvedValue({ id: 'req1', status: 'VERIFIED' });

    const result = await verifyDataRequest('token123');

    expect(result.status).toBe('VERIFIED');
    expect(mockPrisma.dataRequest.update).toHaveBeenCalledWith({
      where: { id: 'req1' },
      data: { verifiedAt: expect.any(Date), status: 'VERIFIED' },
    });
  });

  it('llança error si token no trobat', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue(null);

    await expect(verifyDataRequest('invalid')).rejects.toThrow('Sol·licitud no trobada');
  });

  it('llança error si ja verificada', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({ id: 'req1', verifiedAt: new Date() });

    await expect(verifyDataRequest('token123')).rejects.toThrow('Sol·licitud ja verificada');
  });
});

describe('processDataRequest', () => {
  it('processa sol·licitud ACCESS amb exportació', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      requestType: 'ACCESS',
      customerId: 'cust1',
    });
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      name: 'Test',
      email: 'test@test.com',
      phone: null,
      instagram: null,
      preferredLocale: 'ca',
      source: 'web',
      gdprConsent: true,
      gdprConsentDate: new Date(),
      marketingConsent: false,
      marketingConsentDate: null,
      totalEvents: 1,
      totalSpent: 1000,
      lastEventDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      leads: [],
      testimonials: [],
      discountCodes: [],
      consentRecords: [],
      activityLog: [],
    });
    mockPrisma.dataRequest.update.mockResolvedValue({ id: 'req1', status: 'COMPLETED' });

    const result = await processDataRequest('req1', 'admin', 'DATA_PROVIDED' as any);

    expect(result.status).toBe('COMPLETED');
    expect(mockPrisma.dataRequest.update).toHaveBeenCalledWith({
      where: { id: 'req1' },
      data: expect.objectContaining({ status: 'COMPLETED', processedBy: 'admin' }),
    });
  });

  it('llança error si sol·licitud no existeix', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue(null);

    await expect(processDataRequest('nonexist', 'admin', 'DATA_PROVIDED' as any))
      .rejects.toThrow('Sol·licitud no trobada');
  });

  it('processa sol·licitud ERASURE amb anonimització', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      requestType: 'ERASURE',
      customerId: 'cust1',
    });
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      name: 'Test',
      email: 'test@test.com',
      phone: '123',
      instagram: '@test',
    });
    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.dataRequest.update.mockResolvedValue({ id: 'req1', status: 'COMPLETED' });

    await processDataRequest('req1', 'admin', 'COMPLETED' as any);

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});

describe('getPendingDataRequests', () => {
  it('retorna sol·licituds pendents ordenades per deadline', async () => {
    const requests = [{ id: 'req1' }, { id: 'req2' }];
    mockPrisma.dataRequest.findMany.mockResolvedValue(requests);

    const result = await getPendingDataRequests();

    expect(result).toEqual(requests);
    expect(mockPrisma.dataRequest.findMany).toHaveBeenCalledWith({
      where: { status: { in: ['PENDING', 'VERIFIED', 'IN_PROGRESS'] } },
      orderBy: { legalDeadline: 'asc' },
      include: { customer: { select: { id: true, name: true, email: true } } },
    });
  });
});

describe('getUrgentDataRequests', () => {
  it('usa threshold per defecte de 5 dies', async () => {
    mockPrisma.dataRequest.findMany.mockResolvedValue([]);

    await getUrgentDataRequests();

    expect(mockPrisma.dataRequest.findMany).toHaveBeenCalledWith({
      where: {
        status: { in: ['PENDING', 'VERIFIED', 'IN_PROGRESS'] },
        legalDeadline: { lte: expect.any(Date) },
      },
      orderBy: { legalDeadline: 'asc' },
    });
  });

  it('accepta threshold personalitzat', async () => {
    mockPrisma.dataRequest.findMany.mockResolvedValue([{ id: 'req1' }]);

    const result = await getUrgentDataRequests(10);

    expect(result).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTACIÓ I ANONIMITZACIÓ
// ═══════════════════════════════════════════════════════════════════════════

describe('exportCustomerData', () => {
  const mockCustomer = {
    id: 'cust1',
    name: 'Test Client',
    email: 'test@test.com',
    phone: '123456',
    instagram: '@test',
    preferredLocale: 'ca',
    source: 'web',
    gdprConsent: true,
    gdprConsentDate: new Date(),
    marketingConsent: false,
    marketingConsentDate: null,
    totalEvents: 2,
    totalSpent: 3000,
    lastEventDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    leads: [{ id: 'l1' }],
    testimonials: [],
    discountCodes: [],
    consentRecords: [{ consentType: 'GDPR_BASIC', granted: true }],
    activityLog: [{ action: 'login', details: null, createdAt: new Date() }],
  };

  it('exporta dades en format complet', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);

    const result = await exportCustomerData('cust1');

    expect(result).toHaveProperty('customer');
    expect(result).toHaveProperty('leads');
    expect(result).toHaveProperty('consentRecords');
    expect((result as any).customer.email).toBe('test@test.com');
  });

  it('exporta en format portable', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ ...mockCustomer, activityLog: undefined });

    const result = await exportCustomerData('cust1', true);

    expect(result).toHaveProperty('format', 'GDPR-Portable');
    expect(result).toHaveProperty('data.personalData.email', 'test@test.com');
  });

  it('llança error si client no trobat', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null);

    await expect(exportCustomerData('nonexist')).rejects.toThrow('Client no trobat');
  });
});

describe('anonymizeCustomerData', () => {
  it('anonimitza dades del client', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      name: 'Test',
      email: 'test@test.com',
      phone: '123',
      instagram: '@test',
    });
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await anonymizeCustomerData('cust1');

    expect(result.success).toBe(true);
    expect(result.anonymizedId).toBeDefined();
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('llança error si client no trobat', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null);

    await expect(anonymizeCustomerData('nonexist')).rejects.toThrow('Client no trobat');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AUDITORIA
// ═══════════════════════════════════════════════════════════════════════════

describe('logPrivacyAction', () => {
  it('crea registre d\'auditoria', async () => {
    await logPrivacyAction({
      entityType: 'Customer',
      entityId: 'cust1',
      action: 'DATA_ACCESSED' as any,
      performedBy: 'admin',
    });

    expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: 'Customer',
        entityId: 'cust1',
        action: 'DATA_ACCESSED',
        performedBy: 'admin',
      }),
    });
  });
});

describe('getAuditHistory', () => {
  it('retorna historial per entitat', async () => {
    const logs = [{ id: 'log1', action: 'DATA_ACCESSED' }];
    mockPrisma.privacyAuditLog.findMany.mockResolvedValue(logs);

    const result = await getAuditHistory('Customer', 'cust1');

    expect(result).toEqual(logs);
    expect(mockPrisma.privacyAuditLog.findMany).toHaveBeenCalledWith({
      where: { entityType: 'Customer', entityId: 'cust1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('getAuditSummary', () => {
  it('retorna resum agrupat per acció', async () => {
    mockPrisma.privacyAuditLog.groupBy.mockResolvedValue([
      { action: 'DATA_ACCESSED', _count: 5 },
      { action: 'CONSENT_GRANTED', _count: 10 },
    ]);

    const start = new Date('2026-01-01');
    const end = new Date('2026-03-31');
    const result = await getAuditSummary(start, end);

    expect(result).toEqual([
      { action: 'DATA_ACCESSED', count: 5 },
      { action: 'CONSENT_GRANTED', count: 10 },
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS LEGALS
// ═══════════════════════════════════════════════════════════════════════════

describe('getActiveLegalDocument', () => {
  it('cerca document legal actiu', async () => {
    const doc = { id: 'doc1', type: 'PRIVACY_POLICY', version: '2.0' };
    mockPrisma.legalDocument.findFirst.mockResolvedValue(doc);

    const result = await getActiveLegalDocument('PRIVACY_POLICY' as any, 'ca');

    expect(result).toEqual(doc);
  });
});

describe('getCurrentLegalVersion', () => {
  it('retorna versió del document actiu', async () => {
    mockPrisma.legalDocument.findFirst.mockResolvedValue({ version: '2.1' });

    const result = await getCurrentLegalVersion('PRIVACY_POLICY' as any, 'ca');

    expect(result).toBe('2.1');
  });

  it('retorna null si no hi ha document', async () => {
    mockPrisma.legalDocument.findFirst.mockResolvedValue(null);

    const result = await getCurrentLegalVersion('PRIVACY_POLICY' as any, 'ca');

    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POLÍTIQUES DE RETENCIÓ
// ═══════════════════════════════════════════════════════════════════════════

describe('executeRetentionPolicies', () => {
  it('retorna resultat buit si no hi ha polítiques', async () => {
    mockPrisma.dataRetentionPolicy.findMany.mockResolvedValue([]);

    const result = await executeRetentionPolicies();

    expect(result).toEqual([]);
  });

  it('processa leads amb política DELETE', async () => {
    mockPrisma.dataRetentionPolicy.findMany.mockResolvedValue([
      { id: 'pol1', entityType: 'Lead', retentionDays: 365, actionType: 'DELETE', isActive: true },
    ]);
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }]);
    mockPrisma.lead.delete.mockResolvedValue({});
    mockPrisma.dataRetentionPolicy.update.mockResolvedValue({});

    const result = await executeRetentionPolicies();

    expect(result).toEqual([{ policyId: 'pol1', processed: 2 }]);
    expect(mockPrisma.lead.delete).toHaveBeenCalledTimes(2);
  });

  it('processa leads amb política ANONYMIZE', async () => {
    mockPrisma.dataRetentionPolicy.findMany.mockResolvedValue([
      { id: 'pol1', entityType: 'Lead', retentionDays: 365, actionType: 'ANONYMIZE', isActive: true },
    ]);
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'l1' }]);
    mockPrisma.lead.update.mockResolvedValue({});
    mockPrisma.dataRetentionPolicy.update.mockResolvedValue({});

    const result = await executeRetentionPolicies();

    expect(result[0].processed).toBe(1);
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: expect.objectContaining({ name: 'ARCHIVED' }),
    });
  });

  it('processa CustomerActivity amb DELETE', async () => {
    mockPrisma.dataRetentionPolicy.findMany.mockResolvedValue([
      { id: 'pol2', entityType: 'CustomerActivity', retentionDays: 180, actionType: 'DELETE', isActive: true },
    ]);
    mockPrisma.customerActivity.deleteMany.mockResolvedValue({ count: 15 });
    mockPrisma.dataRetentionPolicy.update.mockResolvedValue({});

    const result = await executeRetentionPolicies();

    expect(result).toEqual([{ policyId: 'pol2', processed: 15 }]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ESTADÍSTIQUES I COMPLIMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('getPrivacyStats', () => {
  it('retorna estadístiques completes', async () => {
    mockPrisma.consentRecord.count
      .mockResolvedValueOnce(100)   // total
      .mockResolvedValueOnce(80);   // active
    mockPrisma.dataRequest.count
      .mockResolvedValueOnce(5)     // pending
      .mockResolvedValueOnce(20);   // completed
    mockPrisma.dataRequest.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]); // urgent

    const result = await getPrivacyStats();

    expect(result).toEqual({
      consents: { total: 100, active: 80 },
      requests: { pending: 5, completed: 20, urgent: 2 },
    });
  });
});

describe('checkGdprCompliance', () => {
  it('retorna compliant si té GDPR_BASIC', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      consentRecords: [{ consentType: 'GDPR_BASIC' }, { consentType: 'MARKETING_EMAIL' }],
    });

    const result = await checkGdprCompliance('cust1');

    expect(result.isCompliant).toBe(true);
    expect(result.hasGdprConsent).toBe(true);
    expect(result.hasMarketingConsent).toBe(true);
  });

  it('retorna no compliant sense GDPR_BASIC', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      consentRecords: [{ consentType: 'MARKETING_EMAIL' }],
    });

    const result = await checkGdprCompliance('cust1');

    expect(result.isCompliant).toBe(false);
    expect(result.hasGdprConsent).toBe(false);
  });

  it('llança error si client no trobat', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null);

    await expect(checkGdprCompliance('nonexist')).rejects.toThrow('Client no trobat');
  });
});
