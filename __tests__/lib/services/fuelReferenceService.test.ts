import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockFetch } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
  mockFetch: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/travelCost', () => ({
  DEFAULT_VEHICLE_COST_PER_KM: 0.15,
  DEFAULT_VEHICLE_CONSUMPTION_L100: 7.5,
  DEFAULT_MAINTENANCE_COST_PER_KM: 0.03,
  calculateEffectiveVehicleCostPerKm: (fuel: number, cons: number, maint: number) =>
    Number(((fuel * cons / 100) + maint).toFixed(4)),
}));

// Mock global fetch
vi.stubGlobal('fetch', mockFetch);

import {
  refreshFuelReferenceNow,
  runFuelDailyRefresh,
  getFuelCostPerKmReference,
  getEffectiveVehicleCostPerKm,
} from '@/lib/services/fuelReferenceService';

describe('refreshFuelReferenceNow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.setting.upsert.mockResolvedValue({});
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '7.5' }); // consumption
  });

  it('parseja preus MITECO i calcula costPerKm', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Fecha: '15/03/2026 08:00',
        ListaEESSPrecio: [
          { 'Precio Gasolina 95 E5': '1,500' },
          { 'Precio Gasolina 95 E5': '1,600' },
          { 'Precio Gasolina 95 E5': '1,700' },
        ],
      }),
    });

    const result = await refreshFuelReferenceNow();

    // avg = (1.5+1.6+1.7)/3 = 1.6
    // costPerKm = (1.6 * 7.5 / 100) = 0.12
    expect(result.pricePerLiter).toBeCloseTo(1.6, 2);
    expect(result.costPerKm).toBeCloseTo(0.12, 2);
    expect(result.sourceDate).toBe('15/03/2026 08:00');
    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(3); // price, cost, updatedAt
  });

  it('llança error si HTTP falla', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(refreshFuelReferenceNow()).rejects.toThrow('FUEL_REFERENCE_HTTP_503');
  });

  it('llança error si no hi ha preus vàlids', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ListaEESSPrecio: [{ 'Precio Gasolina 95 E5': '' }] }),
    });
    await expect(refreshFuelReferenceNow()).rejects.toThrow('NO_VALID_PRICES');
  });

  it('ignora entrades sense preu de gasolina 95', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ListaEESSPrecio: [
          { 'Precio Gasolina 95 E5': '1,500' },
          { 'Precio Gasoleo A': '1,400' }, // no és 95 E5
          { other: 'data' },
        ],
      }),
    });

    const result = await refreshFuelReferenceNow();
    expect(result.pricePerLiter).toBeCloseTo(1.5, 2);
  });

  it('parseja format amb coma decimal espanyol', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ListaEESSPrecio: [{ 'Precio Gasolina 95 E5': '1,459' }],
      }),
    });

    const result = await refreshFuelReferenceNow();
    expect(result.pricePerLiter).toBeCloseTo(1.459, 3);
  });
});

describe('runFuelDailyRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.setting.upsert.mockResolvedValue({});
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '7.5' });
    mockPrisma.adminLog.create.mockResolvedValue({});
  });

  it('crea adminLog AUTOMATION_FUEL_REFRESH', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        Fecha: '15/03/2026',
        ListaEESSPrecio: [{ 'Precio Gasolina 95 E5': '1,500' }],
      }),
    });

    const result = await runFuelDailyRefresh();

    expect(result.costPerKm).toBeGreaterThan(0);
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'AUTOMATION_FUEL_REFRESH',
        entity: 'automation',
        entityId: 'fuel-daily',
      }),
    });
  });
});

describe('getFuelCostPerKmReference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna valor DB si fresc', async () => {
    const recentDate = new Date().toISOString();
    mockPrisma.setting.findUnique
      .mockResolvedValueOnce({ value: '0.12' }) // costPerKm
      .mockResolvedValueOnce({ value: recentDate }); // updatedAt

    const result = await getFuelCostPerKmReference();
    expect(result.costPerKm).toBe(0.12);
    expect(mockFetch).not.toHaveBeenCalled(); // no refresh needed
  });

  it('refresca si dada stale (>24h)', async () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    mockPrisma.setting.findUnique
      .mockResolvedValueOnce({ value: '0.10' })
      .mockResolvedValueOnce({ value: oldDate });

    // Mock refresh
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ListaEESSPrecio: [{ 'Precio Gasolina 95 E5': '1,500' }],
      }),
    });
    mockPrisma.setting.upsert.mockResolvedValue({});

    const result = await getFuelCostPerKmReference();
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result.costPerKm).toBeGreaterThan(0);
  });

  it('retorna DEFAULT si refresh falla i no hi ha BD', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await getFuelCostPerKmReference();
    expect(result.costPerKm).toBe(0.15); // DEFAULT_VEHICLE_COST_PER_KM
  });
});

describe('getEffectiveVehicleCostPerKm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calcula cost des de settings BD', async () => {
    mockPrisma.setting.findUnique
      .mockResolvedValueOnce({ value: '1.5' }) // fuel price
      .mockResolvedValueOnce({ value: '7.5' }) // consumption
      .mockResolvedValueOnce({ value: '0.03' }) // maintenance
      .mockResolvedValueOnce({ value: new Date().toISOString() }); // updatedAt

    const result = await getEffectiveVehicleCostPerKm();

    // costPerKm = (1.5 * 7.5 / 100) + 0.03 = 0.1125 + 0.03 = 0.1425
    expect(result.costPerKm).toBeCloseTo(0.1425, 3);
    expect(result.fuelPricePerLiter).toBe(1.5);
    expect(result.consumptionL100).toBe(7.5);
    expect(result.maintenanceCostPerKm).toBe(0.03);
  });

  it('retorna DEFAULT si no hi ha preu MITECO', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);

    const result = await getEffectiveVehicleCostPerKm();
    expect(result.costPerKm).toBe(0.15); // DEFAULT
    expect(result.fuelPricePerLiter).toBe(0);
    expect(result.updatedAt).toBeNull();
  });

  it('usa defaults per consum i manteniment si no configurats', async () => {
    mockPrisma.setting.findUnique
      .mockResolvedValueOnce({ value: '1.6' }) // fuel price exists
      .mockResolvedValueOnce(null) // no consumption → default 7.5
      .mockResolvedValueOnce(null) // no maintenance → default 0.03
      .mockResolvedValueOnce({ value: new Date().toISOString() });

    const result = await getEffectiveVehicleCostPerKm();
    expect(result.consumptionL100).toBe(7.5);
    expect(result.maintenanceCostPerKm).toBe(0.03);
    // costPerKm = (1.6 * 7.5 / 100) + 0.03 = 0.15
    expect(result.costPerKm).toBeCloseTo(0.15, 2);
  });
});
