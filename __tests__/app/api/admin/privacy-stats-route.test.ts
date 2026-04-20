import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockGetStats } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGetStats: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/privacyService', () => ({ getPrivacyStats: mockGetStats }));

import { GET } from '@/app/api/admin/privacy/stats/route';

describe('GET /api/admin/privacy/stats', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockGetStats.mockResolvedValue({ totalConsents: 50, pendingRequests: 2 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(401);
  });

  it('retorna estadístiques', async () => {
    const res = await GET(new NextRequest('http://localhost/x'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalConsents).toBe(50);
  });

  it('retorna 500 si falla', async () => {
    mockGetStats.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(500);
  });
});
