/**
 * Tests per cashFlowForecast — previsió de tresoreria mensual.
 * Mock de Prisma + costEngine per testejar la lògica d'agrupació i càlcul.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const { mockPrisma, mockGetConfig, mockComputeSummary } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
  },
  mockGetConfig: vi.fn(),
  mockComputeSummary: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/profitabilityService', () => ({
  getProfitabilityConfig: mockGetConfig,
}));
vi.mock('@/lib/services/costEngine', () => ({
  computeBookingFinancialSummary: mockComputeSummary,
}));

import { buildCashFlowForecast } from '@/lib/services/cashFlowForecast';

// ─── Helpers ────────────────────────────────────────────────────────────────

function futureDate(monthsAhead: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  d.setDate(15); // mid-month
  return d;
}

function monthKey(monthsAhead: number): string {
  const d = futureDate(monthsAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const DEFAULT_CONFIG = { fixedCostPerEvent: 50, vehicleCostPerKm: 0.19 };

function makeBooking(monthsAhead: number, overrides: Record<string, unknown> = {}) {
  return {
    eventDate: futureDate(monthsAhead),
    total: 3000,
    depositAmount: 1000,
    depositPaid: false,
    remainingPaid: false,
    remainingAmount: null,
    travelCost: null,
    distanceKm: 80,
    pack: { price: 1200, extraHourPrice: 75 },
    extras: [{ price: 100, quantity: 2 }],
    extraHours: 1,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('buildCashFlowForecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfig.mockResolvedValue(DEFAULT_CONFIG);
    mockComputeSummary.mockReturnValue({ directCost: 500 });
  });

  it('retorna mesos buits si no hi ha reserves', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildCashFlowForecast(3);

    expect(result).toHaveLength(3);
    expect(result[0].income).toBe(0);
    expect(result[0].costs).toBe(0);
    expect(result[0].netFlow).toBe(0);
    expect(result[0].cumulative).toBe(0);
  });

  it('calcula ingressos pendents correctament (dipòsit + resta)', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking(0, { total: 3000, depositAmount: 1000, depositPaid: false, remainingPaid: false }),
    ]);

    const result = await buildCashFlowForecast(3);
    const currentMonth = result[0];

    // pendingIncome = 1000 (dipòsit) + 2000 (resta) = 3000
    expect(currentMonth.income).toBe(3000);
  });

  it('exclou dipòsit si ja pagat', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking(0, { total: 3000, depositAmount: 1000, depositPaid: true, remainingPaid: false }),
    ]);

    const result = await buildCashFlowForecast(3);

    // pendingIncome = 2000 (resta)
    expect(result[0].income).toBe(2000);
  });

  it('exclou resta si ja pagada', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking(0, { total: 3000, depositAmount: 1000, depositPaid: false, remainingPaid: true }),
    ]);

    const result = await buildCashFlowForecast(3);

    // pendingIncome = 1000 (dipòsit)
    expect(result[0].income).toBe(1000);
  });

  it('calcula costos via computeBookingFinancialSummary', async () => {
    mockComputeSummary.mockReturnValue({ directCost: 800 });
    mockPrisma.booking.findMany.mockResolvedValue([makeBooking(0)]);

    const result = await buildCashFlowForecast(3);

    expect(result[0].costs).toBe(800);
    expect(mockComputeSummary).toHaveBeenCalledOnce();
  });

  it('calcula netFlow i cumulative correctament', async () => {
    mockComputeSummary.mockReturnValue({ directCost: 500 });
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking(0, { total: 2000, depositAmount: 500, depositPaid: false, remainingPaid: false }),
      makeBooking(1, { total: 3000, depositAmount: 1000, depositPaid: false, remainingPaid: false }),
    ]);

    const result = await buildCashFlowForecast(3);

    // Mes 0: income=2000, costs=500, net=1500
    expect(result[0].netFlow).toBe(1500);
    expect(result[0].cumulative).toBe(1500);

    // Mes 1: income=3000, costs=500, net=2500
    expect(result[1].netFlow).toBe(2500);
    expect(result[1].cumulative).toBe(4000);

    // Mes 2: income=0, costs=0, net=0
    expect(result[2].netFlow).toBe(0);
    expect(result[2].cumulative).toBe(4000);
  });

  it('ignora reserves fora del rang de mesos', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking(10), // fora del rang de 3 mesos
    ]);

    const result = await buildCashFlowForecast(3);

    expect(result.every((m) => m.income === 0)).toBe(true);
  });

  it('retorna claus de mes en format YYYY-MM', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildCashFlowForecast(3);

    for (const month of result) {
      expect(month.month).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('usa remainingAmount si disponible', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      makeBooking(0, {
        total: 5000,
        depositAmount: 1000,
        remainingAmount: 3500, // Explícitament definit (pot incloure descompte)
        depositPaid: true,
        remainingPaid: false,
      }),
    ]);

    const result = await buildCashFlowForecast(3);

    // remainingAmount explícit = 3500
    expect(result[0].income).toBe(3500);
  });

  it('respecta el paràmetre monthsAhead', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildCashFlowForecast(12);

    expect(result).toHaveLength(12);
  });
});
