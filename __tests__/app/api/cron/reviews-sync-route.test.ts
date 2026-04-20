import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockFetchSerpAPI, mockWriteCache, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  mockFetchSerpAPI: vi.fn(),
  mockWriteCache: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/reviewsSyncService', () => ({
  fetchFromSerpAPI: mockFetchSerpAPI,
}));
vi.mock('@/lib/services/googleReviewsCacheService', () => ({
  writeGoogleReviewsCache: mockWriteCache,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/reviews-sync/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/reviews-sync', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

const serpData = {
  rating: 4.8,
  total: 120,
  reviews: [
    { author: 'Maria', rating: 5, text: 'Excel·lent!' },
    { author: 'Joan', rating: 4, text: 'Molt bé' },
  ],
};

describe('GET /api/cron/reviews-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-reviews');
    mockFetchSerpAPI.mockResolvedValue(serpData);
    mockWriteCache.mockResolvedValue(undefined);
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockFetchSerpAPI).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const res = await GET(makeRequest('wrong'));
    expect(res.status).toBe(401);
  });

  it('sincronitza ressenyes i escriu cache', async () => {
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.rating).toBe(4.8);
    expect(body.total).toBe(120);
    expect(body.synced).toBe(2);
    expect(mockWriteCache).toHaveBeenCalledWith({ rating: 4.8, total: 120, reviews: serpData.reviews });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.reviewsSync', status: 'ok' })
    );
  });

  it('retorna ok:false si SerpAPI no retorna dades', async () => {
    mockFetchSerpAPI.mockResolvedValueOnce(null);
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('SerpAPI');
    expect(mockWriteCache).not.toHaveBeenCalled();
  });

  it('guarda status error si falla', async () => {
    mockFetchSerpAPI.mockRejectedValueOnce(new Error('Network error'));
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'Error intern' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.reviewsSync', status: 'error', message: 'Network error' })
    );
  });
});
