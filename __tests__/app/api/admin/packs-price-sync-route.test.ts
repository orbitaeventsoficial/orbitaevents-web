import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockSyncPrices } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockSyncPrices: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/services/packPricingHealth', () => ({ syncPackPublicPricesToRecommended: mockSyncPrices }));

import { POST } from '@/app/api/admin/packs/price-sync/route';

describe('POST /api/admin/packs/price-sync', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockSyncPrices.mockResolvedValue({ synced: 3 }); });

  it('rebutja sense auth ni cron', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(401);
  });

  it('sincronitza preus amb auth admin', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(200);
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
    delete process.env.CRON_SECRET;
  });
});
