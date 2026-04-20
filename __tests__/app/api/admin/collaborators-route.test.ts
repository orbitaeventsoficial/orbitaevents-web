import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockList, mockCreate, mockGet, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/collaboratorAdminService', () => ({
  listAdminCollaborators: mockList,
  createAdminCollaborator: mockCreate,
  getAdminCollaborator: mockGet,
  updateAdminCollaborator: mockUpdate,
  deleteAdminCollaborator: mockDelete,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { GET as ListGET, POST } from '@/app/api/admin/collaborators/route';
import { GET as DetailGET, PATCH, DELETE } from '@/app/api/admin/collaborators/[id]/route';

describe('GET /api/admin/collaborators (list)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockList.mockResolvedValue([{ id: 'col-1', name: 'DJ Max' }]); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await ListGET(new NextRequest('http://localhost/api/admin/collaborators'))).status).toBe(401);
  });

  it('retorna llista', async () => {
    const res = await ListGET(new NextRequest('http://localhost/api/admin/collaborators'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 'col-1', name: 'DJ Max' }]);
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await ListGET(new NextRequest('http://localhost/api/admin/collaborators'))).status).toBe(500);
  });
});

describe('POST /api/admin/collaborators', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockCreate.mockResolvedValue({ status: 201, body: { id: 'col-2' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const req = new NextRequest('http://localhost/api/admin/collaborators', { method: 'POST', body: JSON.stringify({ name: 'Test' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(401);
  });

  it('crea col·laborador', async () => {
    const req = new NextRequest('http://localhost/api/admin/collaborators', { method: 'POST', body: JSON.stringify({ name: 'Fotògraf' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({ name: 'Fotògraf' });
  });

  it('retorna 500 si falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/api/admin/collaborators', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(500);
  });
});

describe('GET /api/admin/collaborators/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockGet.mockResolvedValue({ status: 200, body: { id: 'col-1', name: 'DJ Max' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await DetailGET(new NextRequest('http://localhost/api/admin/collaborators/col-1'), { params: { id: 'col-1' } })).status).toBe(401);
  });

  it('retorna detall', async () => {
    const res = await DetailGET(new NextRequest('http://localhost/api/admin/collaborators/col-1'), { params: { id: 'col-1' } });
    expect(res.status).toBe(200);
    expect(mockGet).toHaveBeenCalledWith('col-1');
  });

  it('retorna 404 si no existeix', async () => {
    mockGet.mockResolvedValueOnce({ status: 404, body: { error: 'No trobat' } });
    expect((await DetailGET(new NextRequest('http://localhost/api/admin/collaborators/xxx'), { params: { id: 'xxx' } })).status).toBe(404);
  });

  it('retorna 500 si falla', async () => {
    mockGet.mockRejectedValueOnce(new Error('DB'));
    expect((await DetailGET(new NextRequest('http://localhost/api/admin/collaborators/col-1'), { params: { id: 'col-1' } })).status).toBe(500);
  });
});

describe('PATCH /api/admin/collaborators/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockUpdate.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('actualitza correctament', async () => {
    const req = new NextRequest('http://localhost/api/admin/collaborators/col-1', { method: 'PATCH', body: JSON.stringify({ name: 'Nou nom' }), headers: { 'Content-Type': 'application/json' } });
    const res = await PATCH(req, { params: { id: 'col-1' } });
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith('col-1', { name: 'Nou nom' });
  });

  it('retorna 500 si falla', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/api/admin/collaborators/col-1', { method: 'PATCH', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, { params: { id: 'col-1' } })).status).toBe(500);
  });
});

describe('DELETE /api/admin/collaborators/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockDelete.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('elimina correctament', async () => {
    const req = new NextRequest('http://localhost/api/admin/collaborators/col-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: 'col-1' } });
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith('col-1');
  });

  it('retorna 500 si falla', async () => {
    mockDelete.mockRejectedValueOnce(new Error('DB'));
    expect((await DELETE(new NextRequest('http://localhost/api/admin/collaborators/col-1', { method: 'DELETE' }), { params: { id: 'col-1' } })).status).toBe(500);
  });
});
