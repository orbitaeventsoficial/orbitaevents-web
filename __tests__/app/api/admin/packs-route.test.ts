import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockList, mockCreate } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/packAdminService', () => ({
  listAdminPacks: mockList,
  createAdminPack: mockCreate,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { GET, POST } from '@/app/api/admin/packs/route';

describe('GET /api/admin/packs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockList.mockResolvedValue([{ id: 'p1' }]);
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/packs'))).status).toBe(401);
  });

  it('retorna packs amb locale per defecte ca', async () => {
    await GET(new NextRequest('http://localhost/api/admin/packs'));
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockList).toHaveBeenCalledWith('ca', false);
  });

  it('passa locale i includeInactive', async () => {
    await GET(new NextRequest('http://localhost/api/admin/packs?locale=es&includeInactive=true'));
    expect(mockList).toHaveBeenCalledWith('es', true);
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/packs'))).status).toBe(500);
  });
});

describe('POST /api/admin/packs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreate.mockResolvedValue({ status: 201, body: { id: 'p2' } });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ name: 'Premium' }), headers: { 'Content-Type': 'application/json' } });

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o crear', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ name: 'Premium' }), headers: { 'Content-Type': 'application/json' } });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('crea pack', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ name: 'Premium' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(201);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreate).toHaveBeenCalledWith({ name: 'Premium' });
  });

  it('retorna 500 si falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB'));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(500);
  });
});
