import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockSyncPrices } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockSyncPrices: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/packPricingHealth', () => ({ syncPackPublicPricesToRecommended: mockSyncPrices }));

import { POST } from '@/app/api/admin/packs/price-sync/route';

describe('POST /api/admin/packs/price-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockSyncPrices.mockResolvedValue({ synced: 3 });
  });

  it('rebutja sense auth ni cron', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockSyncPrices).not.toHaveBeenCalled();
  });

  it('rebutja permis automation abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockSyncPrices).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de sincronitzar al cami admin', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockSyncPrices).not.toHaveBeenCalled();
  });

  it('sincronitza preus amb auth admin', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.synced).toBe(3);
  });

  it('permet accés amb Bearer cron', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST', headers: { authorization: 'Bearer cron-secret' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockRequireAuth).not.toHaveBeenCalled();
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });
});
