import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetDetail, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetDetail: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/inventoryAdminService', () => ({
  getInventoryItemDetails: mockGetDetail,
  updateInventoryItem: mockUpdate,
  deleteInventoryItem: mockDelete,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, PATCH, DELETE } from '@/app/api/admin/inventory/[id]/route';

const ctx = { params: { id: 'i1' } };

describe('GET /api/admin/inventory/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockGetDetail.mockResolvedValue({ status: 200, body: { id: 'i1' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(401);
  });

  it('retorna detall', async () => {
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(200);
    expect(mockGetDetail).toHaveBeenCalledWith('i1');
  });

  it('passthrough 404', async () => {
    mockGetDetail.mockResolvedValueOnce({ status: 404, body: { error: 'No trobat' } });
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(404);
  });

  it('retorna 500 si falla', async () => {
    mockGetDetail.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(500);
  });
});

describe('PATCH /api/admin/inventory/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpdate.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('actualitza element', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'Nou' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith('i1', { name: 'Nou' });
  });

  it('retorna 500 si falla', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(500);
  });
});

describe('DELETE /api/admin/inventory/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockDelete.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('elimina element', async () => {
    expect((await DELETE(new NextRequest('http://localhost/x', { method: 'DELETE' }), ctx)).status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith('i1');
  });

  it('retorna 500 si falla', async () => {
    mockDelete.mockRejectedValueOnce(new Error('DB'));
    expect((await DELETE(new NextRequest('http://localhost/x', { method: 'DELETE' }), ctx)).status).toBe(500);
  });
});
