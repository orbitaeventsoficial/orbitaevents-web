/**
 * Tests per pipelineForecast — previsió de vendes combinada.
 * Mock de Prisma + commercialScoring per testejar la lògica de previsió.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const { mockPrisma, mockScoreLead, mockEstimateAmount } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    booking: { findMany: vi.fn() },
  },
  mockScoreLead: vi.fn(),
  mockEstimateAmount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/commercialScoring', () => ({
  scoreLead: mockScoreLead,
  estimateLeadAmount: mockEstimateAmount,
}));

import { buildPipelineForecast } from '@/lib/services/pipelineForecast';

// ─── Helpers ────────────────────────────────────────────────────────────────

function futureDate(monthsAhead: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  d.setDate(15);
  return d;
}

function pastDate(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(15);
  return d;
}

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    status: 'NEW',
    createdAt: new Date(),
    updatedAt: new Date(),
    eventDate: futureDate(2),
    budget: '2000 EUR',
    phone: '612345678',
    eventLocation: 'Barcelona',
    guestCount: 100,
    interestedPackId: 'pack-1',
    source: 'WEBSITE',
    eventType: 'WEDDING',
    ...overrides,
  };
}

function makeHistoricBooking(monthsBack: number, total: number) {
  return {
    eventDate: pastDate(monthsBack),
    total,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('buildPipelineForecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockScoreLead.mockReturnValue({ probability: 0.5, score: 50 });
    mockEstimateAmount.mockReturnValue(2000);
  });

  it('retorna mesos buits si no hi ha leads ni històric', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildPipelineForecast(3);

    expect(result).toHaveLength(3);
    expect(result.every((m) => m.pipeline === 0)).toBe(true);
    expect(result.every((m) => m.historicalAvg === 0)).toBe(true);
    expect(result.every((m) => m.combined === 0)).toBe(true);
  });

  it('calcula pipeline ponderat (amount × probability)', async () => {
    mockScoreLead.mockReturnValue({ probability: 0.6, score: 60 });
    mockEstimateAmount.mockReturnValue(3000);
    mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate: futureDate(2) })]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildPipelineForecast(3);

    // weighted = 3000 × 0.6 = 1800
    const targetMonth = result.find((m) => m.pipeline > 0);
    expect(targetMonth).toBeDefined();
    expect(targetMonth!.pipeline).toBe(1800);
  });

  it('distribueix leads sense data als pròxims 3 mesos', async () => {
    mockScoreLead.mockReturnValue({ probability: 0.5, score: 50 });
    mockEstimateAmount.mockReturnValue(3000);
    mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate: null })]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildPipelineForecast(6);

    // weighted = 3000 × 0.5 = 1500, distributed = 500 per month (months 1,2,3)
    const withPipeline = result.filter((m) => m.pipeline > 0);
    expect(withPipeline.length).toBeGreaterThanOrEqual(2); // at least some months get pipeline
    const totalPipeline = result.reduce((s, m) => s + m.pipeline, 0);
    expect(totalPipeline).toBe(1500);
  });

  it('calcula mitjana històrica per mes calendari', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);

    // 2 anys de dades per al mes actual+1
    const targetMonth = new Date().getMonth() + 2; // +2 perquè el forecast comença al mes següent
    const monthsBack1 = 12; // any passat, mateix mes
    const monthsBack2 = 24; // 2 anys enrere

    mockPrisma.booking.findMany.mockResolvedValue([
      makeHistoricBooking(monthsBack1, 4000),
      makeHistoricBooking(monthsBack2, 6000),
    ]);

    const result = await buildPipelineForecast(6);

    // Algun mes ha de tenir historicalAvg > 0
    const withHistory = result.filter((m) => m.historicalAvg > 0);
    expect(withHistory.length).toBeGreaterThanOrEqual(1);
  });

  it('combina 60% pipeline + 40% històric si pipeline > 0', async () => {
    mockScoreLead.mockReturnValue({ probability: 1.0, score: 100 });
    mockEstimateAmount.mockReturnValue(1000);

    const eventDate = futureDate(1);
    mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate })]);

    // Crear històric per al mateix mes calendari
    const historicMonth = eventDate.getMonth() + 1;
    const monthsBack = 12;
    const historicDate = new Date();
    historicDate.setMonth(historicDate.getMonth() - monthsBack);
    historicDate.setDate(15);
    // Ajustar perquè caigui al mes correcte
    while (historicDate.getMonth() + 1 !== historicMonth) {
      historicDate.setMonth(historicDate.getMonth() + 1);
    }

    mockPrisma.booking.findMany.mockResolvedValue([
      { eventDate: historicDate, total: 5000 },
    ]);

    const result = await buildPipelineForecast(6);

    // El mes amb pipeline hauria de tenir combined = round(1000*0.6 + 5000*0.4) = round(2600)
    const monthWithBoth = result.find((m) => m.pipeline > 0 && m.historicalAvg > 0);
    if (monthWithBoth) {
      expect(monthWithBoth.combined).toBe(
        Math.round(monthWithBoth.pipeline * 0.6 + monthWithBoth.historicalAvg * 0.4),
      );
    }
  });

  it('usa 100% històric si no hi ha pipeline', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([
      makeHistoricBooking(12, 3000),
    ]);

    const result = await buildPipelineForecast(6);

    for (const month of result) {
      if (month.historicalAvg > 0) {
        expect(month.combined).toBe(Math.round(month.historicalAvg));
      }
    }
  });

  it('retorna claus de mes en format YYYY-MM', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildPipelineForecast(3);

    for (const month of result) {
      expect(month.month).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('comença al mes SEGÜENT (no l\'actual)', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const expectedFirstKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

    const result = await buildPipelineForecast(3);

    expect(result[0].month).toBe(expectedFirstKey);
  });

  it('respecta el paràmetre monthsAhead', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const result = await buildPipelineForecast(12);

    expect(result).toHaveLength(12);
  });

  // Regressió: `buildPipelineForecast` ha de propagar `now` a `scoreLead` i
  // acceptar un `now?` extern per fer-lo testable deterministament. Abans, la
  // funció cridava `new Date()` internament i `scoreLead(lead)` sense `now`,
  // fent que la probabilitat calculada depengués del rellotge real del server
  // mentre la resta de la funció usava una copia congelada. Per valors concrets
  // de fronteres això portava a inconsistències silencioses al dashboard de
  // `/admin/economia` i al cockpit principal `/admin`.
  it('determinisme: accepta `now` extern i el primer mes sempre és el següent', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    // Amb `now` = 2026-06-15, el primer mes del forecast ha de ser 2026-07
    const result = await buildPipelineForecast(3, new Date('2026-06-15T12:00:00Z'));

    expect(result[0].month).toBe('2026-07');
    expect(result[1].month).toBe('2026-08');
    expect(result[2].month).toBe('2026-09');
  });

  it('determinisme: `now` es propaga a scoreLead amb una còpia del lead que l\'inclou', async () => {
    mockScoreLead.mockReturnValue({ probability: 0.5, score: 50 });
    mockEstimateAmount.mockReturnValue(2000);
    const leadFixture = makeLead({ eventDate: new Date('2026-08-15T00:00:00Z') });
    mockPrisma.lead.findMany.mockResolvedValue([leadFixture]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    const injectedNow = new Date('2026-06-15T12:00:00Z');
    await buildPipelineForecast(3, injectedNow);

    // scoreLead ha de rebre el lead amb `now` injectat
    expect(mockScoreLead).toHaveBeenCalledWith(expect.objectContaining({ now: injectedNow }));
  });

  it('determinisme: dues crides amb el mateix `now` i mateixes dades donen el mateix resultat', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate: new Date('2026-08-15T00:00:00Z') })]);
    mockPrisma.booking.findMany.mockResolvedValue([
      { eventDate: new Date('2025-08-15T00:00:00Z'), total: 5000 },
    ]);

    const now = new Date('2026-06-15T12:00:00Z');
    const a = await buildPipelineForecast(3, now);
    const b = await buildPipelineForecast(3, now);
    expect(a).toEqual(b);
  });

  // ─── D.14 — Confidence band (1σ Bernoulli) ────────────────────────────────
  describe('confidence band ±1σ', () => {
    it('retorna pipelineLow=pipelineHigh=0 quan no hi ha leads', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const result = await buildPipelineForecast(3);

      expect(result.every((m) => m.pipelineLow === 0 && m.pipelineHigh === 0)).toBe(true);
      expect(result.every((m) => m.combinedLow === 0 && m.combinedHigh === 0)).toBe(true);
    });

    it('genera banda no negativa: pipelineLow ≤ pipeline ≤ pipelineHigh', async () => {
      mockScoreLead.mockReturnValue({ probability: 0.5, score: 50 });
      mockEstimateAmount.mockReturnValue(2000);
      const eventDate = new Date('2026-08-15T00:00:00Z');
      mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate })]);
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const result = await buildPipelineForecast(6, new Date('2026-06-15T12:00:00Z'));
      const target = result.find((m) => m.pipeline > 0);

      expect(target).toBeDefined();
      expect(target!.pipelineLow).toBeGreaterThanOrEqual(0);
      expect(target!.pipelineLow).toBeLessThanOrEqual(target!.pipeline);
      expect(target!.pipelineHigh).toBeGreaterThanOrEqual(target!.pipeline);
    });

    it('lead segur (p=1): banda col·lapsada perquè variància Bernoulli=0', async () => {
      mockScoreLead.mockReturnValue({ probability: 1, score: 100 });
      mockEstimateAmount.mockReturnValue(3000);
      const eventDate = new Date('2026-08-15T00:00:00Z');
      mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate })]);
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const result = await buildPipelineForecast(6, new Date('2026-06-15T12:00:00Z'));
      const target = result.find((m) => m.pipeline > 0);

      expect(target).toBeDefined();
      expect(target!.pipelineLow).toBe(target!.pipeline);
      expect(target!.pipelineHigh).toBe(target!.pipeline);
    });

    it('amplada exacta: per p=0.5, σ = amount × 0.5 = amount/2', async () => {
      mockScoreLead.mockReturnValue({ probability: 0.5, score: 50 });
      mockEstimateAmount.mockReturnValue(4000);
      const eventDate = new Date('2026-08-15T00:00:00Z');
      mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate })]);
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const result = await buildPipelineForecast(6, new Date('2026-06-15T12:00:00Z'));
      const target = result.find((m) => m.pipeline > 0);

      // Variància d'una Bernoulli sola: a²·p·(1-p) = 4000² × 0.25 = 4 000 000
      // σ = sqrt(4 000 000) = 2000. Pipeline = 4000 × 0.5 = 2000.
      // Banda: [max(0, 2000 - 2000), 2000 + 2000] = [0, 4000].
      expect(target!.pipeline).toBe(2000);
      expect(target!.pipelineLow).toBe(0);
      expect(target!.pipelineHigh).toBe(4000);
    });

    it('combina la banda amb l\'històric igual que la previsió central (60/40)', async () => {
      mockScoreLead.mockReturnValue({ probability: 0.5, score: 50 });
      mockEstimateAmount.mockReturnValue(4000);
      const eventDate = new Date('2026-08-15T00:00:00Z');
      mockPrisma.lead.findMany.mockResolvedValue([makeLead({ eventDate })]);

      // Construir històric per al mateix mes calendari (agost)
      mockPrisma.booking.findMany.mockResolvedValue([
        { eventDate: new Date('2025-08-15T00:00:00Z'), total: 1000 },
      ]);

      const result = await buildPipelineForecast(6, new Date('2026-06-15T12:00:00Z'));
      const target = result.find((m) => m.pipeline > 0 && m.historicalAvg > 0);

      expect(target).toBeDefined();
      // pipeline = 2000, pipelineLow = 0, pipelineHigh = 4000, historicalAvg = 1000
      // combined = round(2000·0.6 + 1000·0.4) = round(1600) = 1600
      // combinedLow = round(0·0.6 + 1000·0.4) = 400
      // combinedHigh = round(4000·0.6 + 1000·0.4) = 2800
      expect(target!.combined).toBe(1600);
      expect(target!.combinedLow).toBe(400);
      expect(target!.combinedHigh).toBe(2800);
    });

    it('quan no hi ha pipeline, els 3 valors combinats igualen l\'històric', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.booking.findMany.mockResolvedValue([
        { eventDate: new Date('2025-08-15T00:00:00Z'), total: 5000 },
      ]);

      const result = await buildPipelineForecast(6, new Date('2026-06-15T12:00:00Z'));
      const target = result.find((m) => m.historicalAvg > 0);

      expect(target).toBeDefined();
      expect(target!.combined).toBe(target!.historicalAvg);
      expect(target!.combinedLow).toBe(target!.historicalAvg);
      expect(target!.combinedHigh).toBe(target!.historicalAvg);
    });
  });
});
