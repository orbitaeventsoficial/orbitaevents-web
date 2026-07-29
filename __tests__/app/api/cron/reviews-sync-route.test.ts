import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockRunReviewsSync } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  mockRunReviewsSync: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/reviewsSyncService', () => ({
  runReviewsSync: mockRunReviewsSync,
}));

import { GET } from '@/app/api/cron/reviews-sync/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/reviews-sync', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

const serpData = {
  ok: true,
  rating: 4.8,
  total: 120,
  synced: 2,
};

describe('GET /api/cron/reviews-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-reviews');
    mockRunReviewsSync.mockResolvedValue(serpData);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockRunReviewsSync).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const res = await GET(makeRequest('wrong'));
    expect(res.status).toBe(401);
  });

  it('sincronitza ressenyes amb el runner compartit', async () => {
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.rating).toBe(4.8);
    expect(body.total).toBe(120);
    expect(body.synced).toBe(2);
    expect(mockRunReviewsSync).toHaveBeenCalledWith('reviews-sync:req-reviews');
  });

  it('retorna ok:false si SerpAPI no retorna dades', async () => {
    mockRunReviewsSync.mockResolvedValueOnce({ ok: false, error: 'SerpAPI no ha retornat resultats' });
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('SerpAPI');
  });

  it('guarda status error si falla', async () => {
    mockRunReviewsSync.mockRejectedValueOnce(new Error('Network error'));
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'Error intern' });
    expect(mockLog.error).toHaveBeenCalled();
  });
});
