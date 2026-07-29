import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockRunReviewsSync,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRunReviewsSync: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/services/reviewsSyncService', () => ({
  runReviewsSync: mockRunReviewsSync,
}));

import { POST } from '@/app/api/admin/google-reviews/sync/route';

function makePostReq() {
  return new NextRequest('http://localhost/api/admin/google-reviews/sync', {
    method: 'POST',
  });
}

describe('/api/admin/google-reviews/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRunReviewsSync.mockResolvedValue({ ok: true, rating: 4.9, total: 122, synced: 12 });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq());

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockRunReviewsSync).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de sincronitzar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq();

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockRunReviewsSync).not.toHaveBeenCalled();
  });

  it('sincronitza reviews amb sessió admin i retorna resultat', async () => {
    const res = await POST(makePostReq());

    expect(res.status).toBe(200);
    expect(mockRunReviewsSync).toHaveBeenCalledWith('reviews-sync:admin');
    await expect(res.json()).resolves.toEqual({ ok: true, rating: 4.9, total: 122, synced: 12 });
  });

  it('retorna 502 si SerpAPI no dona resultats', async () => {
    mockRunReviewsSync.mockResolvedValueOnce({ ok: false, error: 'SerpAPI no ha retornat resultats' });

    const res = await POST(makePostReq());

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'SerpAPI no ha retornat resultats' });
  });

  it('retorna 500 si falla la sincronització', async () => {
    mockRunReviewsSync.mockRejectedValueOnce(new Error('Network'));

    const res = await POST(makePostReq());

    expect(res.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Error sincronitzant ressenyes' });
  });
});
