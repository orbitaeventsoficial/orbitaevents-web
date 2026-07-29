import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findFirst: vi.fn(),
    },
    clientSurvey: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    setting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));

import {
  listAdminStats,
  updateAdminStatFallback,
  isAdminStatKey,
} from '@/lib/services/adminStatsService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.count.mockResolvedValue(50);
  mockPrisma.booking.aggregate.mockResolvedValue({ _sum: { guestCount: 3000 } });
  mockPrisma.booking.findFirst.mockResolvedValue({ eventDate: new Date('2020-01-01') });
  mockPrisma.clientSurvey.count.mockResolvedValue(0);
  mockPrisma.clientSurvey.aggregate.mockResolvedValue({ _avg: { overallRating: null } });
  mockPrisma.setting.findMany.mockResolvedValue([]);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.setting.deleteMany.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('isAdminStatKey', () => {
  it('retorna true per claus vàlides', () => {
    expect(isAdminStatKey('stats.events_completed')).toBe(true);
    expect(isAdminStatKey('stats.rating_average')).toBe(true);
  });

  it('retorna false per claus invàlides', () => {
    expect(isAdminStatKey('stats.fake')).toBe(false);
    expect(isAdminStatKey('')).toBe(false);
  });
});

describe('listAdminStats', () => {
  it('retorna 5 estadístiques', async () => {
    const result = await listAdminStats();

    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('key');
    expect(result[0]).toHaveProperty('value');
    expect(result[0]).toHaveProperty('calculated');
  });

  it('usa valors calculats sense fallback', async () => {
    const result = await listAdminStats();

    const eventsCompleted = result.find((s) => s.key === 'stats.events_completed')!;
    expect(eventsCompleted.calculated).toBe(50);
    expect(eventsCompleted.isManual).toBe(false);
    expect(eventsCompleted.value).toBe(50);
  });

  it('usa fallback manual si existeix', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'stats.events_completed', value: '200' },
    ]);

    const result = await listAdminStats();

    const eventsCompleted = result.find((s) => s.key === 'stats.events_completed')!;
    expect(eventsCompleted.isManual).toBe(true);
    expect(eventsCompleted.value).toBe(200);
    expect(eventsCompleted.fallback).toBe(200);
  });

  it('ignora fallbacks manuals no finits o parcials', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'stats.events_completed', value: 'Infinity' },
      { key: 'stats.people_entertained', value: '12abc' },
      { key: 'stats.years_experience', value: '-4' },
      { key: 'stats.rating_average', value: '4.8' },
    ]);

    const result = await listAdminStats();

    const eventsCompleted = result.find((s) => s.key === 'stats.events_completed')!;
    const peopleEntertained = result.find((s) => s.key === 'stats.people_entertained')!;
    const yearsExperience = result.find((s) => s.key === 'stats.years_experience')!;
    const ratingAverage = result.find((s) => s.key === 'stats.rating_average')!;

    expect(eventsCompleted.isManual).toBe(false);
    expect(eventsCompleted.value).toBe(50);
    expect(peopleEntertained.isManual).toBe(false);
    expect(peopleEntertained.value).toBe(3000);
    expect(yearsExperience.isManual).toBe(false);
    expect(yearsExperience.value).toBeGreaterThanOrEqual(6);
    expect(ratingAverage.isManual).toBe(true);
    expect(ratingAverage.value).toBe(4.8);
  });

  it('calcula satisfacció amb fallback 95% sense dades', async () => {
    const result = await listAdminStats();

    const satisfaction = result.find((s) => s.key === 'stats.satisfaction_percent')!;
    expect(satisfaction.calculated).toBe(95);
  });

  it('calcula rating amb fallback 5.0 sense dades', async () => {
    const result = await listAdminStats();

    const rating = result.find((s) => s.key === 'stats.rating_average')!;
    expect(rating.calculated).toBe(5.0);
  });
});

describe('updateAdminStatFallback', () => {
  it('llança error amb clau invàlida', async () => {
    await expect(
      updateAdminStatFallback({ key: 'stats.fake' })
    ).rejects.toThrow('Estadística no vàlida');
  });

  it('reseteja a calculat', async () => {
    const result = await updateAdminStatFallback({
      key: 'stats.events_completed',
      resetToCalculated: true,
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.setting.deleteMany).toHaveBeenCalledWith({
      where: { key: 'stats.events_completed' },
    });
    expect(mockPrisma.adminLog.create).toHaveBeenCalled();
  });

  it('actualitza fallback', async () => {
    const result = await updateAdminStatFallback({
      key: 'stats.events_completed',
      fallback: 300,
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'stats.events_completed' },
        update: { value: '300' },
      })
    );
  });

  it('llança error amb fallback negatiu', async () => {
    await expect(
      updateAdminStatFallback({ key: 'stats.events_completed', fallback: -5 })
    ).rejects.toThrow('El fallback ha de ser un número positiu');
  });

  it('llança error amb fallback no finit', async () => {
    await expect(
      updateAdminStatFallback({ key: 'stats.events_completed', fallback: Number.NaN })
    ).rejects.toThrow('El fallback ha de ser un número positiu');

    await expect(
      updateAdminStatFallback({ key: 'stats.events_completed', fallback: Infinity })
    ).rejects.toThrow('El fallback ha de ser un número positiu');
  });
});
