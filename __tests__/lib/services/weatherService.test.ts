import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), warn: vi.fn() } }));

import { getEventWeatherForecast } from '@/lib/services/weatherService';

const originalEnv = process.env.OPENWEATHERMAP_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([]);
  process.env.OPENWEATHERMAP_API_KEY = '';
  // Reset module-level cache by reimporting — skip in this test, test behavior instead
});

afterEach(() => {
  process.env.OPENWEATHERMAP_API_KEY = originalEnv || '';
});

describe('getEventWeatherForecast', () => {
  it('retorna array buit sense API key', async () => {
    delete process.env.OPENWEATHERMAP_API_KEY;

    const result = await getEventWeatherForecast();

    expect(result).toEqual([]);
    expect(mockPrisma.booking.findMany).not.toHaveBeenCalled();
  });

  it('retorna array buit sense reserves', async () => {
    process.env.OPENWEATHERMAP_API_KEY = 'test-key';

    const result = await getEventWeatherForecast();

    expect(result).toEqual([]);
  });
});
