import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customerActivity: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  getCustomerDetail,
  updateCustomerFromInput,
  deleteCustomerOrAnonymize,
} from '@/lib/services/customerRouteService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.customer.findFirst.mockResolvedValue(null);
  mockPrisma.customer.update.mockResolvedValue({ id: 'c1', name: 'Updated' });
  mockPrisma.customer.delete.mockResolvedValue({});
  mockPrisma.customerActivity.create.mockResolvedValue({});
});

describe('getCustomerDetail', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getCustomerDetail('c-inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna client amb relacions', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'c1',
      name: 'Maria',
      leads: [],
      bookings: [],
    });

    const result = await getCustomerDetail('c1');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });

  it('filtra tasques obertes excloent DONE i CANCELLED', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', name: 'Maria', tasks: [] });

    await getCustomerDetail('c1');

    expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          tasks: expect.objectContaining({
            where: { status: { notIn: ['DONE', 'CANCELLED'] } },
          }),
        }),
      }),
    );
  });
});

describe('updateCustomerFromInput', () => {
  it('normalitza nom', async () => {
    await updateCustomerFromInput('c1', { name: ' María García ' });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'María García',
          nameNormalized: 'maria garcia',
        }),
      })
    );
  });

  it('retorna 409 si email duplicat', async () => {
    mockPrisma.customer.findFirst.mockResolvedValue({ id: 'other' });

    const result = await updateCustomerFromInput('c1', { email: 'used@test.com' });

    expect(result.status).toBe(409);
  });

  it('normalitza email', async () => {
    await updateCustomerFromInput('c1', { email: 'Test@Test.COM ' });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@test.com',
          emailNormalized: 'test@test.com',
        }),
      })
    );
  });

  it('normalitza telèfon', async () => {
    await updateCustomerFromInput('c1', { phone: '+34 600 123 456' });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '+34 600 123 456',
          phoneNormalized: '34600123456',
        }),
      })
    );
  });

  it('gestiona consentiments', async () => {
    await updateCustomerFromInput('c1', { gdprConsent: true, marketingConsent: true });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gdprConsent: true,
          gdprConsentDate: expect.any(Date),
          marketingConsent: true,
          marketingConsentDate: expect.any(Date),
        }),
      })
    );
  });

  it('crea customerActivity', async () => {
    await updateCustomerFromInput('c1', { name: 'Nou Nom' });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'PROFILE_UPDATED' }),
      })
    );
  });

  it('gestiona birthday com a Date', async () => {
    await updateCustomerFromInput('c1', { birthday: '1990-05-15' });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          birthday: new Date('1990-05-15'),
        }),
      })
    );
  });

  it('gestiona birthday null', async () => {
    await updateCustomerFromInput('c1', { birthday: null });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          birthday: null,
        }),
      })
    );
  });

  it('gestiona referredById', async () => {
    await updateCustomerFromInput('c1', { referredById: 'c-referrer' });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referredById: 'c-referrer',
        }),
      })
    );
  });

  it('normalitza DNI', async () => {
    await updateCustomerFromInput('c1', { dni: ' 12345678-Z ' });

    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dni: '12345678-Z',
          dniNormalized: '12345678Z',
        }),
      })
    );
  });
});

describe('deleteCustomerOrAnonymize', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await deleteCustomerOrAnonymize('c-inexistent');
    expect(result.status).toBe(404);
  });

  it('anonimitza si té reserves', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'c1',
      _count: { bookings: 2, proposals: 0 },
    });

    const result = await deleteCustomerOrAnonymize('c1');

    expect(result.status).toBe(200);
    expect(result.body.anonymized).toBe(true);
    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Client anonimitzat' }),
      })
    );
  });

  it('elimina si no té reserves ni pressupostos', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({
      id: 'c1',
      _count: { bookings: 0, proposals: 0 },
    });

    const result = await deleteCustomerOrAnonymize('c1');

    expect(result.status).toBe(200);
    expect(result.body.deleted).toBe(true);
    expect(mockPrisma.customer.delete).toHaveBeenCalled();
  });
});
