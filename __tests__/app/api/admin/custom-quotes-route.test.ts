import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockList, mockCreate, mockGet, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/customQuoteAdminService', () => ({
  listAdminCustomQuotes: mockList,
  createAdminCustomQuote: mockCreate,
  getAdminCustomQuote: mockGet,
  updateAdminCustomQuote: mockUpdate,
  deleteAdminCustomQuote: mockDelete,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { GET as ListGET, POST } from '@/app/api/admin/custom-quotes/route';
import { GET as DetailGET, PATCH, DELETE } from '@/app/api/admin/custom-quotes/[id]/route';

describe('GET /api/admin/custom-quotes (list)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockList.mockResolvedValue([{ id: 'cq-1' }]); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await ListGET(new NextRequest('http://localhost/api/admin/custom-quotes'))).status).toBe(401);
  });

  it('retorna llista', async () => {
    const res = await ListGET(new NextRequest('http://localhost/api/admin/custom-quotes'));
    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body).toEqual([{ id: 'cq-1' }]);
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await ListGET(new NextRequest('http://localhost/api/admin/custom-quotes'))).status).toBe(500);
  });
});

describe('POST /api/admin/custom-quotes', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockCreate.mockResolvedValue({ status: 201, body: { id: 'cq-2' } }); });

  it('crea custom quote', async () => {
    const req = new NextRequest('http://localhost/api/admin/custom-quotes', { method: 'POST', body: JSON.stringify({ title: 'Pressupost especial' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreate).toHaveBeenCalledWith({ title: 'Pressupost especial' });
  });

  it('rebutja CSRF abans de crear', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/custom-quotes', { method: 'POST', body: JSON.stringify({ title: 'No' }), headers: { 'Content-Type': 'application/json' } });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/api/admin/custom-quotes', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(500);
  });
});

describe('GET /api/admin/custom-quotes/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockGet.mockResolvedValue({ status: 200, body: { id: 'cq-1' } }); });

  it('retorna detall', async () => {
    const res = await DetailGET(new NextRequest('http://localhost/api/admin/custom-quotes/cq-1'), { params: { id: 'cq-1' } });
    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledWith('cq-1');
  });

  it('retorna 404', async () => {
    mockGet.mockResolvedValueOnce({ status: 404, body: { error: 'No trobat' } });
    expect((await DetailGET(new NextRequest('http://localhost/api/admin/custom-quotes/xxx'), { params: { id: 'xxx' } })).status).toBe(404);
  });

  it('retorna 500 si falla', async () => {
    mockGet.mockRejectedValueOnce(new Error('DB'));
    expect((await DetailGET(new NextRequest('http://localhost/api/admin/custom-quotes/cq-1'), { params: { id: 'cq-1' } })).status).toBe(500);
  });
});

describe('PATCH /api/admin/custom-quotes/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpdate.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('actualitza correctament', async () => {
    const req = new NextRequest('http://localhost/api/admin/custom-quotes/cq-1', { method: 'PATCH', body: JSON.stringify({ title: 'Nou' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, { params: { id: 'cq-1' } })).status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdate).toHaveBeenCalledWith('cq-1', { title: 'Nou' });
  });

  it('rebutja CSRF abans dactualitzar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/custom-quotes/cq-1', { method: 'PATCH', body: JSON.stringify({ title: 'No' }), headers: { 'Content-Type': 'application/json' } });

    const res = await PATCH(req, { params: { id: 'cq-1' } });

    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/api/admin/custom-quotes/cq-1', { method: 'PATCH', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, { params: { id: 'cq-1' } })).status).toBe(500);
  });
});

describe('DELETE /api/admin/custom-quotes/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockDelete.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('elimina correctament', async () => {
    const req = new NextRequest('http://localhost/api/admin/custom-quotes/cq-1', { method: 'DELETE' });
    expect((await DELETE(req, { params: { id: 'cq-1' } })).status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockDelete).toHaveBeenCalledWith('cq-1');
  });

  it('rebutja CSRF abans deliminar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/custom-quotes/cq-1', { method: 'DELETE' });

    const res = await DELETE(req, { params: { id: 'cq-1' } });

    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla', async () => {
    mockDelete.mockRejectedValueOnce(new Error('DB'));
    expect((await DELETE(new NextRequest('http://localhost/api/admin/custom-quotes/cq-1', { method: 'DELETE' }), { params: { id: 'cq-1' } })).status).toBe(500);
  });
});
