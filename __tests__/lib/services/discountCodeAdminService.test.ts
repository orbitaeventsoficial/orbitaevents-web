import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    discountCode: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminDiscountCodes,
  createAdminDiscountCode,
} from '@/lib/services/discountCodeAdminService';

const NOW = new Date();
const FUTURE = new Date('2027-12-31');
const PAST = new Date('2020-01-01');

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.discountCode.findMany.mockResolvedValue([]);
  mockPrisma.discountCode.findUnique.mockResolvedValue(null);
  mockPrisma.discountCode.create.mockResolvedValue({ id: 'dc-1', code: 'TEST10' });
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('listAdminDiscountCodes', () => {
  it('retorna codis amb stats', async () => {
    mockPrisma.discountCode.findMany.mockResolvedValue([
      { id: 'dc-1', isActive: true, validUntil: FUTURE, currentUses: 5 },
      { id: 'dc-2', isActive: false, validUntil: PAST, currentUses: 10 },
    ]);

    const result = await listAdminDiscountCodes();

    expect(result.ok).toBe(true);
    expect(result.codes).toHaveLength(2);
    expect(result.stats.total).toBe(2);
    expect(result.stats.active).toBe(1);
    expect(result.stats.expired).toBe(1);
    expect(result.stats.totalUses).toBe(15);
  });

  it('retorna stats buits si no hi ha codis', async () => {
    const result = await listAdminDiscountCodes();

    expect(result.stats.total).toBe(0);
    expect(result.stats.totalUses).toBe(0);
  });
});

describe('createAdminDiscountCode', () => {
  it('crea codi i retorna 200', async () => {
    const result = await createAdminDiscountCode({
      code: 'test10',
      type: 'PERCENTAGE',
      value: 10,
      validUntil: '2027-12-31',
      isAccumulative: false,
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });

  it('normalitza codi a majúscules', async () => {
    await createAdminDiscountCode({
      code: '  summer sale  ',
      type: 'PERCENTAGE',
      value: 15,
      validUntil: '2027-12-31',
      isAccumulative: false,
    });

    expect(mockPrisma.discountCode.findUnique).toHaveBeenCalledWith({
      where: { code: 'SUMMER SALE' },
    });
  });

  it('retorna 409 si codi duplicat', async () => {
    mockPrisma.discountCode.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await createAdminDiscountCode({
      code: 'EXISTING',
      type: 'PERCENTAGE',
      value: 10,
      validUntil: '2027-12-31',
      isAccumulative: false,
    });

    expect(result.status).toBe(409);
  });

  it('crea adminLog', async () => {
    await createAdminDiscountCode({
      code: 'NEW10',
      type: 'FIXED_AMOUNT',
      value: 50,
      validUntil: '2027-12-31',
      isAccumulative: true,
    });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CREATE',
        entity: 'discountCode',
      }),
    });
  });

  it('usa sourceType MANUAL per defecte', async () => {
    await createAdminDiscountCode({
      code: 'MANUAL10',
      type: 'PERCENTAGE',
      value: 10,
      validUntil: '2027-12-31',
      isAccumulative: false,
    });

    expect(mockPrisma.discountCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sourceType: 'MANUAL' }),
    });
  });
});
