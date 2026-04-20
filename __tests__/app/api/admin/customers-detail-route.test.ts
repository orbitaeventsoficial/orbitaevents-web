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
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/customerRouteService', () => ({
  getCustomerDetail: mockGetDetail,
  updateCustomerFromInput: mockUpdate,
  deleteCustomerOrAnonymize: mockDelete,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-cd') }));

import { GET, PATCH, DELETE } from '@/app/api/admin/customers/[id]/route';

const ctx = { params: { id: 'c1' } };

describe('GET /api/admin/customers/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockGetDetail.mockResolvedValue({ status: 200, body: { id: 'c1', name: 'Anna' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(401);
  });

  it('retorna detall', async () => {
    const res = await GET(new NextRequest('http://localhost/x'), ctx);
    expect(res.status).toBe(200);
    expect(mockGetDetail).toHaveBeenCalledWith('c1');
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

describe('PATCH /api/admin/customers/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpdate.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'X' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'X' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(403);
  });

  it('actualitza client', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'Anna B' }), headers: { 'Content-Type': 'application/json' } });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith('c1', { name: 'Anna B' });
  });

  it('rebutja dades Zod invàlides', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'A' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'Anna B' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(500);
  });
});

describe('DELETE /api/admin/customers/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockDelete.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await DELETE(new NextRequest('http://localhost/x', { method: 'DELETE' }), ctx)).status).toBe(401);
  });

  it('elimina/anonimitza client', async () => {
    const res = await DELETE(new NextRequest('http://localhost/x', { method: 'DELETE' }), ctx);
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith('c1');
  });

  it('retorna 500 si falla', async () => {
    mockDelete.mockRejectedValueOnce(new Error('DB'));
    expect((await DELETE(new NextRequest('http://localhost/x', { method: 'DELETE' }), ctx)).status).toBe(500);
  });
});
