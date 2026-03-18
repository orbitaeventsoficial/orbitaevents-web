import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetByCode, mockGetPacks } = vi.hoisted(() => ({
  mockGetByCode: vi.fn(),
  mockGetPacks: vi.fn(),
}));

vi.mock('@/lib/packs-db', () => ({
  getDbPackByCode: mockGetByCode,
  getDbPacks: mockGetPacks,
}));

import { resolveQuotePack } from '@/lib/services/quotes/quotePack';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetByCode.mockResolvedValue(null);
  mockGetPacks.mockResolvedValue([]);
});

describe('resolveQuotePack', () => {
  it('retorna pack per codi', async () => {
    mockGetByCode.mockResolvedValue({
      name: 'Premium',
      priceValue: 800,
      durationHours: 5,
      extraHourPrice: 85,
      emotion: 'La millor experiència',
    });

    const result = await resolveQuotePack('premium', 'ca');

    expect(result.name).toBe('Premium');
    expect(result.price).toBe(800);
    expect(result.djHours).toBe(5);
  });

  it('retorna fallback si codi no existeix', async () => {
    mockGetPacks.mockResolvedValue([{
      name: 'Bàsic',
      priceValue: 400,
      durationHours: 4,
      extraHourPrice: 75,
      tagline: 'Pack bàsic',
    }]);

    const result = await resolveQuotePack('inexistent');

    expect(result.name).toBe('Bàsic');
    expect(result.price).toBe(400);
  });

  it('retorna valors per defecte si no hi ha packs', async () => {
    const result = await resolveQuotePack('inexistent');

    expect(result.name).toBe('Servei DJ Professional');
    expect(result.price).toBe(500);
    expect(result.djHours).toBe(4);
    expect(result.extraHourPrice).toBe(75);
  });

  it('usa tagline com a description si no hi ha emotion', async () => {
    mockGetByCode.mockResolvedValue({
      name: 'Còctel',
      priceValue: 600,
      durationHours: 3,
      tagline: 'Perfecte per a còctels',
    });

    const result = await resolveQuotePack('coctel');

    expect(result.description).toBe('Perfecte per a còctels');
  });
});
