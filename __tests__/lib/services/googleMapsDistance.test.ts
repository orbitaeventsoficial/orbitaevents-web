import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    GOOGLE_MAPS_API_KEY: 'test-api-key',
    ORBITA_BASE_ADDRESS: 'Granollers, Barcelona',
  },
}));

vi.mock('@/lib/env', () => ({ env: mockEnv }));

import { calculateGoogleMapsDistance } from '@/lib/services/googleMapsDistance';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockEnv.GOOGLE_MAPS_API_KEY = 'test-api-key';
});

describe('calculateGoogleMapsDistance', () => {
  it('llança error sense API key', async () => {
    mockEnv.GOOGLE_MAPS_API_KEY = '';

    await expect(
      calculateGoogleMapsDistance({ destination: 'Barcelona' })
    ).rejects.toThrow('GOOGLE_MAPS_API_KEY_NOT_CONFIGURED');
  });

  it('llança error sense destination', async () => {
    await expect(
      calculateGoogleMapsDistance({ destination: '' })
    ).rejects.toThrow('DESTINATION_REQUIRED');
  });

  it('calcula distància correctament', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        origin_addresses: ['Granollers, Barcelona, Spain'],
        destination_addresses: ['Girona, Spain'],
        rows: [{
          elements: [{
            status: 'OK',
            distance: { value: 78500 },
            duration: { text: '52 min' },
          }],
        }],
      }),
    });

    const result = await calculateGoogleMapsDistance({ destination: 'Girona' });

    expect(result.oneWayKm).toBe(78.5);
    expect(result.roundTripKm).toBe(157);
    expect(result.durationText).toBe('52 min');
    expect(result.origin).toBe('Granollers, Barcelona');
  });

  it('llança error si status no OK', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'REQUEST_DENIED' }),
    });

    await expect(
      calculateGoogleMapsDistance({ destination: 'Girona' })
    ).rejects.toThrow('GOOGLE_MAPS_STATUS_REQUEST_DENIED');
  });

  it('llança error HTTP', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    await expect(
      calculateGoogleMapsDistance({ destination: 'Girona' })
    ).rejects.toThrow('GOOGLE_MAPS_HTTP_403');
  });
});
