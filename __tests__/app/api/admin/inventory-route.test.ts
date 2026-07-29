import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockList, mockCreate } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/inventoryAdminService', () => ({
  listInventoryAdminData: mockList,
  createInventoryItem: mockCreate,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, POST } from '@/app/api/admin/inventory/route';

describe('GET /api/admin/inventory', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockList.mockResolvedValue({ items: [], total: 0 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/inventory'))).status).toBe(401);
  });

  it('retorna llista', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/inventory'));
    expect(res.status).toBe(200);
  });

  it('passa filtres', async () => {
    await GET(new NextRequest('http://localhost/api/admin/inventory?category=SOUND&status=AVAILABLE&search=micro'));
    expect(mockList).toHaveBeenCalledWith({ category: 'SOUND', status: 'AVAILABLE', search: 'micro' });
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/inventory'))).status).toBe(500);
  });
});

describe('POST /api/admin/inventory', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockCreate.mockResolvedValue({ status: 201, body: { id: 'i1' } }); });

  it('crea element', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ name: 'Micro SM58', category: 'SOUND', value: 100 }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rebutja Zod invàlid (sense name)', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ category: 'SOUND', value: 100 }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(400);
  });

  it('rebutja value negatiu', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ name: 'X', category: 'SOUND', value: -1 }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ name: 'X', category: 'SOUND', value: 50 }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(500);
  });
});
