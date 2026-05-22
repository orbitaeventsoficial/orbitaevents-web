import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  buildWeeklyCapacityForecast,
  loadWeeklyCapacityForecast,
} from '@/lib/services/operationalForecastService';

const NOW = new Date('2026-05-21T10:00:00Z');

function booking(id: string, isoDate: string, guestCount = 80) {
  return { id, eventDate: new Date(isoDate), guestCount };
}

describe('buildWeeklyCapacityForecast', () => {
  it('retorna weeksAhead setmanes amb forecast buit si no hi ha reserves', () => {
    const result = buildWeeklyCapacityForecast({
      upcomingBookings: [],
      previousYearBookings: [],
      now: NOW,
      weeksAhead: 4,
      maxBookingsPerDay: 2,
      warningThreshold: 5,
      criticalThreshold: 7,
    });
    expect(result).toHaveLength(4);
    expect(result.every((w) => w.bookingsCount === 0)).toBe(true);
    expect(result.every((w) => w.alertLevel === 'NONE')).toBe(true);
    expect(result.every((w) => w.alertMessage === null)).toBe(true);
  });

  it('classifica setmana CRITICAL quan supera criticalThreshold', () => {
    const upcoming = [
      booking('b1', '2026-05-21T10:00:00Z'),
      booking('b2', '2026-05-22T10:00:00Z'),
      booking('b3', '2026-05-23T10:00:00Z'),
      booking('b4', '2026-05-23T11:00:00Z'),
      booking('b5', '2026-05-23T12:00:00Z'),
      booking('b6', '2026-05-24T10:00:00Z'),
      booking('b7', '2026-05-24T11:00:00Z'),
    ];
    const result = buildWeeklyCapacityForecast({
      upcomingBookings: upcoming,
      previousYearBookings: [],
      now: NOW,
      weeksAhead: 1,
      maxBookingsPerDay: 2,
      warningThreshold: 5,
      criticalThreshold: 7,
    });
    expect(result[0].bookingsCount).toBe(7);
    expect(result[0].overloadedDays).toBe(1);
    expect(result[0].alertLevel).toBe('CRITICAL');
    expect(result[0].alertMessage).toContain('sobrecarregada');
  });

  it('classifica setmana WARNING quan supera warningThreshold sense sobrecàrrega', () => {
    // Setmana 0 a partir de NOW = 2026-05-21 → startOfWeek = 2026-05-18 (dilluns) a 2026-05-24 (diumenge).
    const upcoming = [
      booking('b1', '2026-05-18T10:00:00Z'),
      booking('b2', '2026-05-19T10:00:00Z'),
      booking('b3', '2026-05-20T10:00:00Z'),
      booking('b4', '2026-05-21T10:00:00Z'),
      booking('b5', '2026-05-22T10:00:00Z'),
    ];
    const result = buildWeeklyCapacityForecast({
      upcomingBookings: upcoming,
      previousYearBookings: [],
      now: NOW,
      weeksAhead: 1,
      maxBookingsPerDay: 2,
      warningThreshold: 5,
      criticalThreshold: 7,
    });
    expect(result[0].alertLevel).toBe('WARNING');
    expect(result[0].overloadedDays).toBe(0);
    expect(result[0].alertMessage).toContain('intensa');
  });

  it('classifica INFO quan hi ha reserves però sota warningThreshold', () => {
    const upcoming = [booking('b1', '2026-05-22T10:00:00Z')];
    const result = buildWeeklyCapacityForecast({
      upcomingBookings: upcoming,
      previousYearBookings: [],
      now: NOW,
      weeksAhead: 1,
      maxBookingsPerDay: 2,
      warningThreshold: 5,
      criticalThreshold: 7,
    });
    expect(result[0].alertLevel).toBe('INFO');
  });

  it('calcula yoyDelta amb reserves any anterior', () => {
    const upcoming = [
      booking('b1', '2026-05-22T10:00:00Z'),
      booking('b2', '2026-05-24T10:00:00Z'),
    ];
    const previous = [
      booking('p1', '2025-05-22T10:00:00Z'),
    ];
    const result = buildWeeklyCapacityForecast({
      upcomingBookings: upcoming,
      previousYearBookings: previous,
      now: NOW,
      weeksAhead: 1,
      maxBookingsPerDay: 2,
      warningThreshold: 5,
      criticalThreshold: 7,
    });
    expect(result[0].bookingsCount).toBe(2);
    expect(result[0].previousYearBookings).toBe(1);
    expect(result[0].yoyDelta).toBe(1);
  });

  it('agrupa reserves per setmana correctament (>1 setmana)', () => {
    const upcoming = [
      booking('b1', '2026-05-22T10:00:00Z'),
      booking('b2', '2026-05-29T10:00:00Z'),
    ];
    const result = buildWeeklyCapacityForecast({
      upcomingBookings: upcoming,
      previousYearBookings: [],
      now: NOW,
      weeksAhead: 2,
      maxBookingsPerDay: 2,
      warningThreshold: 5,
      criticalThreshold: 7,
    });
    expect(result).toHaveLength(2);
    expect(result[0].bookingsCount).toBe(1);
    expect(result[1].bookingsCount).toBe(1);
  });
});

describe('loadWeeklyCapacityForecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crida prisma amb finestres correctes i delega al builder', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);
    const result = await loadWeeklyCapacityForecast(NOW, 4);
    expect(mockPrisma.booking.findMany).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(4);
  });

  it('respecta opcions de llindar personalitzats', async () => {
    mockPrisma.booking.findMany
      .mockResolvedValueOnce([booking('b1', '2026-05-22T10:00:00Z'), booking('b2', '2026-05-23T10:00:00Z')])
      .mockResolvedValueOnce([]);
    const result = await loadWeeklyCapacityForecast(NOW, 1, { warningThreshold: 2, criticalThreshold: 5 });
    expect(result[0].alertLevel).toBe('WARNING');
  });
});
