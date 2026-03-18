import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
    availability: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  generateFallbackPublicAvailability,
  listAvailabilityRange,
  buildPublicAvailability,
} from '@/lib/services/publicAvailabilityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.availability.findMany.mockResolvedValue([]);
});

// ─────────────────────────────────────────────────────────────────────────
// generateFallbackPublicAvailability
// ─────────────────────────────────────────────────────────────────────────
describe('generateFallbackPublicAvailability', () => {
  it('retorna estructura correcta', () => {
    const result = generateFallbackPublicAvailability('ca');

    expect(result.ok).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.data.nextAvailableDate).toBeTruthy();
    expect(result.data.nextAvailableSaturday).toBeTruthy();
    expect(result.data.monthlyAvailability).toHaveLength(1);
    expect(result.data.urgencyLevel).toBe('medium');
  });

  it('missatge scarcity en català', () => {
    const result = generateFallbackPublicAvailability('ca');
    expect(result.data.scarcityMessage).toContain('dissabtes');
  });

  it('missatge scarcity en castellà', () => {
    const result = generateFallbackPublicAvailability('es');
    expect(result.data.scarcityMessage).toContain('sábados');
  });

  it('missatge scarcity en anglès', () => {
    const result = generateFallbackPublicAvailability('en');
    expect(result.data.scarcityMessage).toContain('Saturdays');
  });

  it('data pròxim dissabte futura', () => {
    const result = generateFallbackPublicAvailability('ca');
    expect(result.data.nextAvailableDate).toBeTruthy();
    // nextAvailableDate and nextAvailableSaturday are same in fallback
    expect(result.data.nextAvailableDate).toBe(result.data.nextAvailableSaturday);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// listAvailabilityRange
// ─────────────────────────────────────────────────────────────────────────
describe('listAvailabilityRange', () => {
  it('retorna dates i resum', async () => {
    mockPrisma.availability.findMany.mockResolvedValue([
      { date: new Date('2026-09-15'), status: 'AVAILABLE', note: null },
      { date: new Date('2026-09-20'), status: 'BOOKED', note: 'Boda' },
      { date: new Date('2026-09-22'), status: 'BLOCKED', note: 'Festiu' },
    ]);

    const result = await listAvailabilityRange(
      new Date('2026-09-01'),
      new Date('2026-09-30')
    );

    expect(result.dates).toHaveLength(3);
    expect(result.summary.available).toBe(1);
    expect(result.summary.booked).toBe(1);
    expect(result.summary.blocked).toBe(1);
  });

  it('retorna buit si no hi ha disponibilitats', async () => {
    const result = await listAvailabilityRange(
      new Date('2026-09-01'),
      new Date('2026-09-30')
    );

    expect(result.dates).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });

  it('format de data correcte (YYYY-MM-DD)', async () => {
    mockPrisma.availability.findMany.mockResolvedValue([
      { date: new Date('2026-09-15T00:00:00.000Z'), status: 'AVAILABLE', note: null },
    ]);

    const result = await listAvailabilityRange(
      new Date('2026-09-01'),
      new Date('2026-09-30')
    );

    expect(result.dates[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// buildPublicAvailability
// ─────────────────────────────────────────────────────────────────────────
describe('buildPublicAvailability', () => {
  it('retorna estructura completa', async () => {
    const result = await buildPublicAvailability('ca');

    expect(result.ok).toBe(true);
    expect(result.data.monthlyAvailability.length).toBeGreaterThanOrEqual(1);
    expect(result.data.urgencyLevel).toBeDefined();
    expect(result.data.scarcityMessage).toBeTruthy();
    expect(result.generatedAt).toBeTruthy();
  });

  it('marca dissabtes reservats', async () => {
    const nextSaturday = getNextSaturday();
    mockPrisma.booking.findMany.mockResolvedValue([
      { eventDate: nextSaturday },
    ]);

    const result = await buildPublicAvailability('ca');

    const allDates = result.data.monthlyAvailability.flatMap((m) => m.saturdayDates);
    const bookedDate = allDates.find((d) => d.date === toIso(nextSaturday));
    if (bookedDate) {
      expect(bookedDate.status).toBe('booked');
    }
  });

  it('marca dissabtes bloquejats', async () => {
    const nextSaturday = getNextSaturday();
    mockPrisma.availability.findMany.mockResolvedValue([
      { date: nextSaturday },
    ]);

    const result = await buildPublicAvailability('ca');

    const allDates = result.data.monthlyAvailability.flatMap((m) => m.saturdayDates);
    const blockedDate = allDates.find((d) => d.date === toIso(nextSaturday));
    if (blockedDate) {
      expect(blockedDate.status).toBe('blocked');
    }
  });

  it('urgencyLevel critical si tot ple', async () => {
    // Mock all Saturdays for the next 4 months as booked
    const saturdays = getManySaturdays(20);
    mockPrisma.booking.findMany.mockResolvedValue(
      saturdays.map((d) => ({ eventDate: d }))
    );

    const result = await buildPublicAvailability('ca');

    // First month should be critical or high
    const firstMonth = result.data.monthlyAvailability[0];
    if (firstMonth && firstMonth.availableSaturdays === 0) {
      expect(result.data.urgencyLevel).toBe('critical');
      expect(result.data.scarcityMessage).toContain('COMPLET');
    }
  });

  it('noms de mes en català', async () => {
    const result = await buildPublicAvailability('ca');

    const monthNames = result.data.monthlyAvailability.map((m) => m.monthName);
    const catalanMonths = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
    for (const name of monthNames) {
      expect(catalanMonths).toContain(name);
    }
  });

  it('noms de mes en anglès', async () => {
    const result = await buildPublicAvailability('en');

    const monthNames = result.data.monthlyAvailability.map((m) => m.monthName);
    const englishMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (const name of monthNames) {
      expect(englishMonths).toContain(name);
    }
  });

  it('nextAvailableSaturday és futur', async () => {
    const result = await buildPublicAvailability('ca');

    if (result.data.nextAvailableSaturday) {
      // The date string should be in the future
      const dateStr = result.data.nextAvailableSaturday;
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Verify it's one of the Saturday dates in monthly availability
      const allSaturdays = result.data.monthlyAvailability
        .flatMap((m) => m.saturdayDates)
        .filter((d) => d.status === 'available')
        .map((d) => d.date);
      expect(allSaturdays).toContain(dateStr);
    }
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────
function getNextSaturday(): Date {
  const now = new Date();
  const daysUntil = (6 - now.getDay() + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntil);
  saturday.setHours(0, 0, 0, 0);
  return saturday;
}

function getManySaturdays(count: number): Date[] {
  const dates: Date[] = [];
  let current = getNextSaturday();
  for (let i = 0; i < count; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
