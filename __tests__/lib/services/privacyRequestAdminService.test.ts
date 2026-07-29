import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockExportData, mockAnonymize, mockLogAction, mockSendCompletedEmail } = vi.hoisted(() => ({
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
  mockSendCompletedEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/privacyService', () => ({
  exportCustomerData: mockExportData,
  anonymizeCustomerData: mockAnonymize,
  logPrivacyAction: mockLogAction,
}));
vi.mock('@/lib/email', () => ({
  sendPrivacyRequestCompletedEmail: mockSendCompletedEmail,
}));
vi.mock('@/lib/site', () => ({
  getAppBaseUrl: () => 'https://test.orbita.events',
}));

import { processPrivacyRequestById } from '@/lib/services/privacyRequestAdminService';

const BASE_REQUEST = {
  id: 'req1',
  status: 'VERIFIED',
  requesterEmail: 'ana@example.com',
  requesterName: 'Ana Pérez',
  verificationToken: 'tok-abc',
  customer: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.dataRequest.findUnique.mockResolvedValue(null);
  mockPrisma.dataRequest.update.mockResolvedValue({});
  mockPrisma.consentRecord.updateMany.mockResolvedValue({});
  mockPrisma.customer.update.mockResolvedValue({});
  mockExportData.mockResolvedValue({ name: 'Test', email: 'test@test.com' });
  mockAnonymize.mockResolvedValue(undefined);
  mockLogAction.mockResolvedValue(undefined);
  mockSendCompletedEmail.mockResolvedValue(undefined);
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

  it('envia email de resolució amb enllaç de descàrrega en aprovar ACCESS', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      ...BASE_REQUEST,
      requestType: 'ACCESS',
      customerId: 'c1',
    });

    await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(mockSendCompletedEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ana@example.com',
      name: 'Ana Pérez',
      requestType: 'ACCESS',
      requestId: 'req1',
      result: 'approved',
      downloadUrl: 'https://test.orbita.events/api/privacy/download?token=tok-abc',
    }));
  });

  it('envia email de resolució SENSE enllaç de descàrrega en aprovar ERASURE', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      ...BASE_REQUEST,
      requestType: 'ERASURE',
      customerId: 'c1',
    });

    await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(mockSendCompletedEmail).toHaveBeenCalledWith(expect.objectContaining({
      result: 'approved',
      downloadUrl: undefined,
    }));
  });

  it('envia email de rebuig quan es rebutja la sol·licitud', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      ...BASE_REQUEST,
      requestType: 'ACCESS',
      customerId: 'c1',
    });

    await processPrivacyRequestById('req1', 'reject', 'No compleix requisits', 'admin');

    expect(mockSendCompletedEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ana@example.com',
      result: 'rejected',
      notes: 'No compleix requisits',
    }));
  });

  it('usa el locale preferit del client si hi ha vincle', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      ...BASE_REQUEST,
      requestType: 'ACCESS',
      customerId: 'c1',
      customer: { preferredLocale: 'en' },
    });

    await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(mockSendCompletedEmail).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en' }));
  });

  it('no trenca el processament si l\'enviament d\'email falla', async () => {
    mockPrisma.dataRequest.findUnique.mockResolvedValue({
      ...BASE_REQUEST,
      requestType: 'ACCESS',
      customerId: 'c1',
    });
    mockSendCompletedEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await processPrivacyRequestById('req1', 'approve', undefined, 'admin');

    expect(result.status).toBe(200);
  });
});
