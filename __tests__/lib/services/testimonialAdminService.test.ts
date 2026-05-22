import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customerTestimonial: {
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    customerDiscountCode: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminTestimonials,
  moderateTestimonial,
  countPendingTestimonials,
} from '@/lib/services/testimonialAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customerTestimonial.findMany.mockResolvedValue([]);
  mockPrisma.customerTestimonial.update.mockResolvedValue({ id: 't1' });
  mockPrisma.customerTestimonial.delete.mockResolvedValue({});
  mockPrisma.customerDiscountCode.findMany.mockResolvedValue([]);
});

describe('listAdminTestimonials', () => {
  it('retorna testimonis buits', async () => {
    const result = await listAdminTestimonials({ status: null, limit: 10, offset: 0 });

    expect(result.ok).toBe(true);
    expect(result.testimonials).toEqual([]);
  });

  it('filtra per status pending', async () => {
    await listAdminTestimonials({ status: 'pending', limit: 10, offset: 0 });

    expect(mockPrisma.customerTestimonial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isApproved: false } })
    );
  });

  it('filtra per status approved', async () => {
    await listAdminTestimonials({ status: 'approved', limit: 10, offset: 0 });

    expect(mockPrisma.customerTestimonial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isApproved: true } })
    );
  });

  it('no filtra si status és null', async () => {
    await listAdminTestimonials({ status: null, limit: 10, offset: 0 });

    expect(mockPrisma.customerTestimonial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('resol codis descompte associats', async () => {
    mockPrisma.customerTestimonial.findMany.mockResolvedValue([
      { id: 't1', discountCodeId: 'dc-1', customer: { name: 'Test', email: 'test@test.com' } },
      { id: 't2', discountCodeId: null, customer: { name: 'Test2', email: 'test2@test.com' } },
    ]);
    mockPrisma.customerDiscountCode.findMany.mockResolvedValue([
      { id: 'dc-1', code: 'THANKS10', discountPercent: 10 },
    ]);

    const result = await listAdminTestimonials({ status: null, limit: 10, offset: 0 });

    expect(result.testimonials[0].discountCode).toEqual({ code: 'THANKS10', discountPercent: 10 });
    expect(result.testimonials[1].discountCode).toBeNull();
  });

  it('no consulta codis si cap testimoni en té', async () => {
    mockPrisma.customerTestimonial.findMany.mockResolvedValue([
      { id: 't1', discountCodeId: null, customer: { name: 'T', email: 'e@e.com' } },
    ]);

    await listAdminTestimonials({ status: null, limit: 10, offset: 0 });

    expect(mockPrisma.customerDiscountCode.findMany).not.toHaveBeenCalled();
  });

  it('aplica limit i offset', async () => {
    await listAdminTestimonials({ status: null, limit: 5, offset: 10 });

    expect(mockPrisma.customerTestimonial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, skip: 10 })
    );
  });
});

describe('moderateTestimonial', () => {
  it('retorna 400 sense id o action', async () => {
    expect((await moderateTestimonial(undefined, 'approve')).status).toBe(400);
    expect((await moderateTestimonial('t1', undefined)).status).toBe(400);
    expect((await moderateTestimonial(undefined, undefined)).status).toBe(400);
  });

  it('approve posa isApproved a true', async () => {
    const result = await moderateTestimonial('t1', 'approve');

    expect(result.status).toBe(200);
    expect(mockPrisma.customerTestimonial.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { isApproved: true },
    });
  });

  it('hide posa isApproved a false', async () => {
    const result = await moderateTestimonial('t1', 'hide');

    expect(result.status).toBe(200);
    expect(mockPrisma.customerTestimonial.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { isApproved: false },
    });
  });

  it('delete elimina el testimoni', async () => {
    const result = await moderateTestimonial('t1', 'delete');

    expect(result.status).toBe(200);
    expect(mockPrisma.customerTestimonial.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });

  it('retorna 400 per acció desconeguda', async () => {
    const result = await moderateTestimonial('t1', 'unknown');
    expect(result.status).toBe(400);
  });
});

describe('countPendingTestimonials', () => {
  it('retorna el nombre de testimonis pendents', async () => {
    mockPrisma.customerTestimonial.count.mockResolvedValue(7);

    const result = await countPendingTestimonials();

    expect(result).toBe(7);
    expect(mockPrisma.customerTestimonial.count).toHaveBeenCalledWith({
      where: { isApproved: false },
    });
  });

  it('retorna 0 si no hi ha pendents', async () => {
    mockPrisma.customerTestimonial.count.mockResolvedValue(0);

    const result = await countPendingTestimonials();

    expect(result).toBe(0);
  });
});
