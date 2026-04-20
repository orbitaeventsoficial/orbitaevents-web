import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockGetAlerts } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockGetAlerts: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/services/packPricingHealth', () => ({ getPackPricingAlertsCount: mockGetAlerts }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { GET } from '@/app/api/admin/packs/price-alerts/route';

describe('GET /api/admin/packs/price-alerts', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockGetAlerts.mockResolvedValue(5); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(401);
  });

  it('rebutja sense permission', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(403);
  });

  it('retorna comptador d\'alertes', async () => {
    const res = await GET(new NextRequest('http://localhost/x'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.count).toBe(5);
  });

  it('retorna 500 si falla', async () => {
    mockGetAlerts.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(500);
  });
});
