import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: { findUnique: vi.fn() },
    customerActivity: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listCustomerActivities,
  createCustomerActivityNote,
} from '@/lib/services/customerActivityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
  mockPrisma.customerActivity.findMany.mockResolvedValue([]);
  mockPrisma.customerActivity.create.mockResolvedValue({ id: 'act-1' });
});

describe('listCustomerActivities', () => {
  it('retorna llista d\'activitats', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValue([
      { id: 'act-1', action: 'NOTE_ADDED' },
      { id: 'act-2', action: 'STATUS_CHANGED' },
    ]);

    const result = await listCustomerActivities('cust-1');

    expect(result.ok).toBe(true);
    expect(result.activities).toHaveLength(2);
  });

  it('limita a 120 activitats', async () => {
    await listCustomerActivities('cust-1');

    expect(mockPrisma.customerActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 120 })
    );
  });
});

describe('createCustomerActivityNote', () => {
  it('crea nota i retorna 201', async () => {
    const result = await createCustomerActivityNote('cust-1', { note: 'Nota test' });

    expect(result.status).toBe(201);
    expect(result.body.ok).toBe(true);
  });

  it('retorna 404 si client no existeix', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null);

    const result = await createCustomerActivityNote('inexistent', { note: 'Test' });

    expect(result.status).toBe(404);
  });

  it('usa NOTE_ADDED com acció per defecte', async () => {
    await createCustomerActivityNote('cust-1', { note: 'Test' });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'NOTE_ADDED',
      }),
    });
  });

  it('usa acció personalitzada si es proporciona', async () => {
    await createCustomerActivityNote('cust-1', { action: 'CALL', note: 'Trucada' });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CALL',
      }),
    });
  });
});
