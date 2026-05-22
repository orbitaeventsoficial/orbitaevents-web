import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBookedDates } from '@/lib/hooks/useBookedDates';
import type { PublicAvailabilityResponse } from '@/lib/api/publicAvailabilityClient';

const { mockFetchPublicAvailability } = vi.hoisted(() => ({
  mockFetchPublicAvailability: vi.fn(),
}));

vi.mock('@/lib/api/publicAvailabilityClient', () => ({
  fetchPublicAvailability: mockFetchPublicAvailability,
}));

afterEach(() => {
  mockFetchPublicAvailability.mockReset();
});

const makeResponse = (saturdays: { date: string; status: string }[]): PublicAvailabilityResponse => ({
  ok: true,
  generatedAt: '2026-01-01T00:00:00Z',
  data: {
    nextAvailableDate: null,
    nextAvailableSaturday: null,
    scarcityMessage: '',
    urgencyLevel: 'low',
    monthlyAvailability: [
      {
        month: '2026-06',
        monthName: 'Juny 2026',
        year: 2026,
        totalSaturdays: saturdays.length,
        availableSaturdays: saturdays.filter((s) => s.status === 'available').length,
        bookedSaturdays: saturdays.filter((s) => s.status === 'booked').length,
        blockedSaturdays: saturdays.filter((s) => s.status === 'blocked').length,
        saturdayDates: saturdays as PublicAvailabilityResponse['data']['monthlyAvailability'][0]['saturdayDates'],
      },
    ],
  },
});

describe('useBookedDates', () => {
  it('retorna les dates amb estat booked o blocked', async () => {
    mockFetchPublicAvailability.mockResolvedValue(
      makeResponse([
        { date: '2026-06-06', status: 'booked' },
        { date: '2026-06-13', status: 'available' },
        { date: '2026-06-20', status: 'blocked' },
      ]),
    );
    const { result } = renderHook(() => useBookedDates('ca'));
    await waitFor(() => expect(result.current.size).toBe(2));
    expect(result.current.has('2026-06-06')).toBe(true);
    expect(result.current.has('2026-06-20')).toBe(true);
    expect(result.current.has('2026-06-13')).toBe(false);
  });

  it('retorna un Set buit si la resposta no té ok', async () => {
    mockFetchPublicAvailability.mockResolvedValue({ ok: false, data: null, generatedAt: '' });
    const { result } = renderHook(() => useBookedDates('es'));
    await waitFor(() => expect(mockFetchPublicAvailability).toHaveBeenCalled());
    expect(result.current.size).toBe(0);
  });

  it('retorna un Set buit si fetchPublicAvailability llença un error', async () => {
    mockFetchPublicAvailability.mockRejectedValue(new Error('network fail'));
    const { result } = renderHook(() => useBookedDates('en'));
    await waitFor(() => expect(mockFetchPublicAvailability).toHaveBeenCalled());
    expect(result.current.size).toBe(0);
  });
});
