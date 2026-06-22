import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetById, mockUpdate } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetById: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/packAdminService', () => ({
  getAdminPackById: mockGetById,
  updateAdminPack: mockUpdate,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { GET, PATCH } from '@/app/api/admin/packs/[id]/route';

const ctx = { params: Promise.resolve({ id: 'p1' }) };

describe('GET /api/admin/packs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetById.mockResolvedValue({ status: 200, body: { id: 'p1' } });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(401);
  });

  it('retorna pack', async () => {
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetById).toHaveBeenCalledWith('p1');
  });

  it('passthrough 404', async () => {
    mockGetById.mockResolvedValueOnce({ status: 404, body: { error: 'No trobat' } });
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(404);
  });

  it('retorna 500 si falla', async () => {
    mockGetById.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(500);
  });
});

describe('PATCH /api/admin/packs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockUpdate.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'Nou' }), headers: { 'Content-Type': 'application/json' } });

    const res = await PATCH(req, ctx);

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de resoldre params/body o actualitzar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'Nou' }), headers: { 'Content-Type': 'application/json' } });

    const res = await PATCH(req, ctx);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('actualitza pack', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ name: 'Nou' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdate).toHaveBeenCalledWith('p1', { name: 'Nou' });
  });

  it('retorna 500 si falla', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(500);
  });
});
