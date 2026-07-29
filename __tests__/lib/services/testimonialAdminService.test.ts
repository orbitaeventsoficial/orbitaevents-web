import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    $transaction: vi.fn(),
    customerTestimonial: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    customerDiscountCode: {
      findMany: vi.fn(),
    },
    customerActivity: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminTestimonials,
  moderateTestimonial,
  countPendingTestimonials,
  listPendingTestimonialsForReminder,
} from '@/lib/services/testimonialAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma));
  mockPrisma.customerTestimonial.findMany.mockResolvedValue([]);
  mockPrisma.customerTestimonial.findUnique.mockResolvedValue({
    id: 't1',
    customerId: 'cust-1',
    rating: 5,
    eventType: 'WEDDING',
    text: 'Testimoni molt bo',
  });
  mockPrisma.customerTestimonial.update.mockResolvedValue({ id: 't1' });
  mockPrisma.customerTestimonial.delete.mockResolvedValue({});
  mockPrisma.customerDiscountCode.findMany.mockResolvedValue([]);
  mockPrisma.customerActivity.create.mockResolvedValue({});
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
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-1',
        action: 'TESTIMONIAL_APPROVED',
        details: expect.objectContaining({
          testimonialId: 't1',
          rating: 5,
          eventType: 'WEDDING',
          moderationAction: 'approve',
        }),
      },
    });
  });

  it('hide posa isApproved a false', async () => {
    const result = await moderateTestimonial('t1', 'hide');

    expect(result.status).toBe(200);
    expect(mockPrisma.customerTestimonial.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { isApproved: false },
    });
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        action: 'TESTIMONIAL_HIDDEN',
      }),
    });
  });

  it('delete elimina el testimoni', async () => {
    const result = await moderateTestimonial('t1', 'delete');

    expect(result.status).toBe(200);
    expect(mockPrisma.customerTestimonial.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        action: 'TESTIMONIAL_DELETED',
      }),
    });
  });

  it('retorna 400 per acció desconeguda', async () => {
    const result = await moderateTestimonial('t1', 'unknown');
    expect(result.status).toBe(400);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna 404 si el testimoni no existeix', async () => {
    mockPrisma.customerTestimonial.findUnique.mockResolvedValueOnce(null);

    const result = await moderateTestimonial('missing', 'approve');

    expect(result.status).toBe(404);
    expect(mockPrisma.customerTestimonial.update).not.toHaveBeenCalled();
    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
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

describe('listPendingTestimonialsForReminder', () => {
  it('retorna testimonis pendents normalitzats i limita el volum', async () => {
    const createdAt = new Date('2026-07-10T10:00:00.000Z');
    mockPrisma.customerTestimonial.findMany.mockResolvedValueOnce([
      {
        id: 't1',
        rating: 5,
        text: '  Testimoni   molt   bo  ',
        createdAt,
        customer: { name: 'Maria', email: 'maria@example.com' },
      },
    ]);

    const result = await listPendingTestimonialsForReminder(50);

    expect(mockPrisma.customerTestimonial.findMany).toHaveBeenCalledWith({
      where: { isApproved: false },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    expect(result).toEqual([
      {
        id: 't1',
        name: 'Maria',
        email: 'maria@example.com',
        rating: 5,
        textPreview: 'Testimoni molt bo',
        createdAt,
      },
    ]);
  });
});
