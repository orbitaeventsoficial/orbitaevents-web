import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockPrisma } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockPrisma: {
    consentRecord: { findMany: vi.fn() },
    dataRequest: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { GET } from '@/app/api/admin/customers/[id]/consents/route';

describe('GET /api/admin/customers/[id]/consents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockPrisma.consentRecord.findMany.mockResolvedValue([{ id: 'cr1' }]);
    mockPrisma.dataRequest.findMany.mockResolvedValue([{ id: 'dr1' }]);
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'), { params: Promise.resolve({ id: 'c1' }) })).status).toBe(401);
  });

  it('retorna consents i requests', async () => {
    const res = await GET(new NextRequest('http://localhost/x'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.body.consents).toHaveLength(1);
    expect(body.body.requests).toHaveLength(1);
  });

  it('retorna 500 si falla', async () => {
    mockPrisma.consentRecord.findMany.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'), { params: Promise.resolve({ id: 'c1' }) })).status).toBe(500);
  });
});
