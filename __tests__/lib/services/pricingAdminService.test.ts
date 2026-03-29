import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    extra: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pack: { findMany: vi.fn() },
    inventoryItem: { findMany: vi.fn() },
    booking: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  getPricingAdminData,
  normalizePricingLocale,
  updateExtraPrice,
} from '@/lib/services/pricingAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.extra.findMany.mockResolvedValue([]);
  mockPrisma.pack.findMany.mockResolvedValue([]);
  mockPrisma.inventoryItem.findMany.mockResolvedValue([]);
  mockPrisma.booking.count.mockResolvedValue(0);
  mockPrisma.booking.aggregate.mockResolvedValue({ _sum: { total: 0 } });
  mockPrisma.extra.findUnique.mockResolvedValue(null);
  mockPrisma.extra.update.mockResolvedValue({ id: 'e1', price: 50 });
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('normalizePricingLocale', () => {
  it('retorna ca per defecte', () => {
    expect(normalizePricingLocale(null)).toBe('ca');
    expect(normalizePricingLocale(undefined)).toBe('ca');
    expect(normalizePricingLocale('')).toBe('ca');
  });

  it('detecta es', () => {
    expect(normalizePricingLocale('es')).toBe('es');
    expect(normalizePricingLocale('es-ES')).toBe('es');
  });

  it('detecta en', () => {
    expect(normalizePricingLocale('en')).toBe('en');
    expect(normalizePricingLocale('en-GB')).toBe('en');
  });

  it('retorna ca per valors desconeguts', () => {
    expect(normalizePricingLocale('fr')).toBe('ca');
    expect(normalizePricingLocale('de')).toBe('ca');
  });
});

describe('getPricingAdminData', () => {
  it('propaga costPerUnit dels extres i calcula vendes/revenue', async () => {
    mockPrisma.extra.findMany.mockResolvedValue([
      {
        id: 'extra-1',
        slug: 'fum',
        translations: [{ locale: 'ca', name: 'Màquina de fum', description: 'Ambient', tagline: null }],
        price: 40,
        priceType: 'FIXED',
        isActive: true,
        order: 1,
        costPerUnit: 18,
        inventory: [
          {
            quantity: 1,
            item: { id: 'inv-1', code: 'SMOKE', name: 'Màquina fum', value: 200 },
          },
        ],
        bookingExtras: [
          {
            price: 40,
            quantity: 2,
            booking: { reference: 'B-001', eventDate: new Date('2026-06-10T00:00:00.000Z'), status: 'COMPLETED' },
          },
          {
            price: 35,
            quantity: 1,
            booking: { reference: 'B-002', eventDate: new Date('2026-05-01T00:00:00.000Z'), status: 'CONFIRMED' },
          },
        ],
      },
    ]);

    const result = await getPricingAdminData('ca');

    expect(result.ok).toBe(true);
    expect(result.data.extras).toHaveLength(1);
    expect(result.data.extras[0]).toEqual(
      expect.objectContaining({
        id: 'extra-1',
        name: 'Màquina de fum',
        costPerUnit: 18,
        salesCount: 2,
        totalRevenue: 115,
      })
    );
    expect(result.data.extras[0].linkedInventory).toEqual([
      expect.objectContaining({ itemCode: 'SMOKE', itemName: 'Màquina fum', itemValue: 200, quantity: 1 }),
    ]);
    expect(result.data.stats.topExtras).toEqual([
      expect.objectContaining({ slug: 'fum', totalSales: 2, revenue: 115 }),
    ]);
  });
});

describe('updateExtraPrice', () => {
  it('retorna 400 sense extraId', async () => {
    const result = await updateExtraPrice('', 50);
    expect(result.status).toBe(400);
  });

  it('retorna 400 amb preu negatiu', async () => {
    const result = await updateExtraPrice('e1', -10);
    expect(result.status).toBe(400);
  });

  it('retorna 404 si extra no existeix', async () => {
    const result = await updateExtraPrice('inexistent', 50);
    expect(result.status).toBe(404);
  });

  it('actualitza preu i crea adminLog', async () => {
    mockPrisma.extra.findUnique.mockResolvedValue({
      id: 'e1', slug: 'fog-machine', price: 30,
      translations: [{ locale: 'ca', name: 'Màquina de fum' }],
    });

    const result = await updateExtraPrice('e1', 50);

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(mockPrisma.extra.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { price: 50 },
    });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPDATE',
        entity: 'extra',
        entityId: 'e1',
        details: expect.objectContaining({ oldValue: 30, newValue: 50 }),
      }),
    });
  });

  it('permet preu 0', async () => {
    mockPrisma.extra.findUnique.mockResolvedValue({
      id: 'e1', slug: 'free', price: 10,
      translations: [],
    });

    const result = await updateExtraPrice('e1', 0);
    expect(result.status).toBe(200);
  });
});
