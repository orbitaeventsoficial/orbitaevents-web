import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockExportData, mockAnonymize, mockLogAction } = vi.hoisted(() => ({
  mockPrisma: {
    dataRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    consentRecord: { updateMany: vi.fn() },
    customer: { update: vi.fn() },
  },
  mockExportData: vi.fn(),
  mockAnonymize: vi.fn(),
  mockLogAction: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/privacyService', () => ({
  exportCustomerData: mockExportData,
  anonymizeCustomerData: mockAnonymize,
  logPrivacyAction: mockLogAction,
}));

import { processPrivacyRequestById } from '@/lib/services/privacyRequestAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.dataRequest.findUnique.mockResolvedValue(null);
  mockPrisma.dataRequest.update.mockResolvedValue({});
  mockPrisma.consentRecord.updateMany.mockResolvedValue({});
  mockPrisma.customer.update.mockResolvedValue({});
  mockExportData.mockResolvedValue({ name: 'Test', email: 'test@test.com' });
  mockAnonymize.mockResolvedValue(undefined);
  mockLogAction.mockResolvedValue(undefined);
});

describe('processPrivacyRequestById', () => {
  it('retorna 404 si sol·licitud no existeix', async () => {
    const result = await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(result.status).toBe(404);
  });

  it('retorna 400 si no verificada', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({ id: 'req1', status: 'PENDING' });

    const result = await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(result.status).toBe(400);
  });

  it('rebutja sol·licitud', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      status: 'VERIFIED',
      requestType: 'ACCESS',
      customerId: 'c1',
    });

    const result = await processPrivacyRequestById('req1', 'reject', 'Motiu', 'admin');

    expect(result.status).toBe(200);
    expect(mockPrisma.dataRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REJECTED' }),
      })
    );
  });

  it('aprova ACCESS i exporta dades', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      status: 'VERIFIED',
      requestType: 'ACCESS',
      customerId: 'c1',
    });

    const result = await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(result.status).toBe(200);
    expect(mockExportData).toHaveBeenCalledWith('c1', false);
  });

  it('aprova PORTABILITY amb format portable', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      status: 'VERIFIED',
      requestType: 'PORTABILITY',
      customerId: 'c1',
    });

    await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(mockExportData).toHaveBeenCalledWith('c1', true);
  });

  it('aprova ERASURE i anonimitza', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      status: 'VERIFIED',
      requestType: 'ERASURE',
      customerId: 'c1',
    });

    await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(mockAnonymize).toHaveBeenCalledWith('c1', 'req1');
  });

  it('aprova OBJECTION i revoca consentiments', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      status: 'VERIFIED',
      requestType: 'OBJECTION',
      customerId: 'c1',
    });

    await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(mockPrisma.consentRecord.updateMany).toHaveBeenCalled();
    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ marketingConsent: false }),
      })
    );
  });

  it('registra acció de privacitat', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      id: 'req1',
      status: 'VERIFIED',
      requestType: 'ACCESS',
      customerId: 'c1',
    });

    await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(mockLogAction).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'DataRequest',
        entityId: 'req1',
        legalBasis: 'RGPD Art. 15',
      })
    );
  });
});
