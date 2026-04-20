import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockList, mockSave } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockList: vi.fn(),
  mockSave: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/inventoryBundles', () => ({
  listAdminInventoryBundles: mockList,
  saveAdminInventoryBundles: mockSave,
}));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-ib') }));

import { GET, POST } from '@/app/api/admin/inventory/bundles/route';

describe('GET /api/admin/inventory/bundles', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockList.mockResolvedValue([{ id: 'b1' }]); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(401);
  });

  it('retorna bundles', async () => {
    const res = await GET(new NextRequest('http://localhost/x'));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/admin/inventory/bundles', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockSave.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(403);
  });

  it('guarda bundles', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ items: ['i1'] }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(200);
  });
});
