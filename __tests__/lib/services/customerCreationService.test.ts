import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockFindDuplicates } = vi.hoisted(() => ({
  mockPrisma: {
    customer: {
      findUnique: vi.fn(),
    },
    customerActivity: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  mockFindDuplicates: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/deduplicationService', () => ({
  findDuplicates: mockFindDuplicates,
}));

import { createCustomerFromInput } from '@/lib/services/customerCreationService';

const MOCK_CUSTOMER = {
  id: 'cust-1',
  name: 'Maria García',
  email: 'maria@test.com',
  phone: '+34612345678',
  instagram: null,
  dni: null,
  source: 'WEBSITE',
  preferredLocale: 'ca',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      customer: {
        create: vi.fn().mockResolvedValue(MOCK_CUSTOMER),
      },
      customerActivity: {
        create: vi.fn().mockResolvedValue({}),
      },
      task: {
        create: vi.fn().mockResolvedValue({}),
      },
    };
    return fn(tx);
  });
  mockFindDuplicates.mockResolvedValue([]);
  mockPrisma.customerActivity.create.mockResolvedValue({});
});

describe('createCustomerFromInput', () => {
  it('retorna 400 sense nom', async () => {
    const result = await createCustomerFromInput({ email: 'test@test.com' });
    expect(result.status).toBe(400);
  });

  it('retorna 400 sense email', async () => {
    const result = await createCustomerFromInput({ name: 'Maria' });
    expect(result.status).toBe(400);
  });

  it('retorna 409 si email duplicat', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await createCustomerFromInput({
      name: 'Maria',
      email: 'maria@test.com',
    });

    expect(result.status).toBe(409);
    expect(result.body.error).toContain('email');
  });

  it('retorna 409 si DNI duplicat', async () => {
    // First findUnique (email) returns null, second (DNI) returns existing
    mockPrisma.customer.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing', name: 'Joan' });

    const result = await createCustomerFromInput({
      name: 'Maria',
      email: 'maria@test.com',
      dni: '12345678A',
    });

    expect(result.status).toBe(409);
    expect(result.body.error).toContain('DNI');
  });

  it('crea client correctament amb dades mínimes', async () => {
    const result = await createCustomerFromInput({
      name: 'Maria García',
      email: 'Maria@Test.COM',
    });

    expect(result.status).toBe(201);
    expect(result.message).toContain('creat');
    expect(result.body.id).toBe('cust-1');
  });

  it('normalitza email a minúscules', async () => {
    await createCustomerFromInput({
      name: 'Maria',
      email: '  Maria@Test.COM  ',
    });

    expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
      where: { emailNormalized: 'maria@test.com' },
    });
  });

  it('crea tasca de validació dins la transacció amb source canònic', async () => {
    let taskCreatePayload: Record<string, unknown> | null = null;
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customer: { create: vi.fn().mockResolvedValue(MOCK_CUSTOMER) },
        customerActivity: { create: vi.fn().mockResolvedValue({}) },
        task: {
          create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
            taskCreatePayload = args.data;
            return {};
          }),
        },
      };
      return fn(tx);
    });

    await createCustomerFromInput({ name: 'Maria', email: 'maria@test.com' });

    expect(taskCreatePayload).not.toBeNull();
    expect(taskCreatePayload).toMatchObject({
      customerId: MOCK_CUSTOMER.id,
      status: 'OPEN',
      priority: 'HIGH',
      source: 'CUSTOMER_CREATION',
    });
  });

  it('crea activity amb notes inicials si existeixen', async () => {
    let activityCount = 0;
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customer: { create: vi.fn().mockResolvedValue(MOCK_CUSTOMER) },
        customerActivity: {
          create: vi.fn().mockImplementation(() => {
            activityCount++;
            return {};
          }),
        },
        task: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    await createCustomerFromInput({
      name: 'Maria',
      email: 'maria@test.com',
      notes: 'Nota important',
    });

    // 2 activities: CUSTOMER_CREATED + INITIAL_NOTES
    expect(activityCount).toBe(2);
  });

  it('busca duplicats després de crear', async () => {
    await createCustomerFromInput({ name: 'Maria', email: 'maria@test.com' });

    expect(mockFindDuplicates).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Maria García', email: 'maria@test.com' }),
      'cust-1'
    );
  });

  it('retorna warnings de duplicats', async () => {
    mockFindDuplicates.mockResolvedValue([
      { customer: { id: 'dup-1', name: 'Maria G.', email: 'maria.g@test.com' }, matchScore: 85 },
    ]);

    const result = await createCustomerFromInput({ name: 'Maria', email: 'maria@test.com' });

    expect(result.status).toBe(201);
    const body = result.body as { duplicateWarnings: Array<{ id: string; score: number }> };
    expect(body.duplicateWarnings).toHaveLength(1);
    expect(body.duplicateWarnings[0].score).toBe(85);
  });

  it('registra activity si hi ha duplicats', async () => {
    mockFindDuplicates.mockResolvedValue([
      { customer: { id: 'dup-1', name: 'Dup', email: 'd@test.com' }, matchScore: 90 },
    ]);

    await createCustomerFromInput({ name: 'Maria', email: 'maria@test.com' });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-1',
          action: 'DUPLICATE_WARNING',
        }),
      })
    );
  });

  it('continua si findDuplicates falla', async () => {
    mockFindDuplicates.mockRejectedValue(new Error('DB error'));

    const result = await createCustomerFromInput({ name: 'Maria', email: 'maria@test.com' });

    expect(result.status).toBe(201);
  });

  it('normalitza source invàlid a OTHER', async () => {
    let customerCreateData: Record<string, unknown> = {};
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customer: {
          create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
            customerCreateData = args.data;
            return MOCK_CUSTOMER;
          }),
        },
        customerActivity: { create: vi.fn().mockResolvedValue({}) },
        task: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    await createCustomerFromInput({
      name: 'Maria',
      email: 'maria@test.com',
      source: 'INVALID_SOURCE',
    });

    expect(customerCreateData.source).toBe('OTHER');
  });

  it('normalitza source vàlid correctament', async () => {
    let customerCreateData: Record<string, unknown> = {};
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customer: {
          create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
            customerCreateData = args.data;
            return MOCK_CUSTOMER;
          }),
        },
        customerActivity: { create: vi.fn().mockResolvedValue({}) },
        task: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    await createCustomerFromInput({
      name: 'Maria',
      email: 'maria@test.com',
      source: 'INSTAGRAM',
    });

    expect(customerCreateData.source).toBe('INSTAGRAM');
  });
});
