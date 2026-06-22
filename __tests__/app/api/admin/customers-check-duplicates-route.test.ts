import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockFindDuplicates } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockFindDuplicates: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/deduplicationService', () => ({ findDuplicates: mockFindDuplicates }));

import { POST } from '@/app/api/admin/customers/check-duplicates/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/admin/customers/check-duplicates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockFindDuplicates.mockResolvedValue([{
      customer: { id: 'c1', name: 'Anna', email: 'a@b.cat', phone: '123' },
      matchScore: 85,
      matchReasons: [{ field: 'email', type: 'exact', score: 100 }],
    }]);
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await POST(makeReq({ name: 'Anna' }))).status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de buscar duplicats', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq({ name: 'Anna' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockFindDuplicates).not.toHaveBeenCalled();
  });

  it('retorna duplicats', async () => {
    const req = makeReq({ email: 'a@b.cat' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.duplicates).toHaveLength(1);
    expect(body.duplicates[0].matchScore).toBe(85);
  });

  it('retorna llista buida sense camps', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duplicates).toHaveLength(0);
    expect(mockFindDuplicates).not.toHaveBeenCalled();
  });

  it('retorna llista buida si falla (graceful)', async () => {
    mockFindDuplicates.mockRejectedValueOnce(new Error('DB'));
    const res = await POST(makeReq({ name: 'Anna' }));
    expect(res.status).toBe(200);
    expect((await res.json()).duplicates).toHaveLength(0);
  });
});
