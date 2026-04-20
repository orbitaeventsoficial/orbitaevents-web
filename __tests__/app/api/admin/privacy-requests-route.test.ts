import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockList } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockList: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/privacyRequestListService', () => ({ listAdminPrivacyRequests: mockList }));
vi.mock('@/lib/utils', () => ({ safeParseInt: (_v: unknown, d: number) => d }));

import { GET } from '@/app/api/admin/privacy/requests/route';

describe('GET /api/admin/privacy/requests', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockList.mockResolvedValue({ items: [], total: 0 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(401);
  });

  it('retorna sol·licituds', async () => {
    const res = await GET(new NextRequest('http://localhost/x'));
    expect(res.status).toBe(200);
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(500);
  });
});
