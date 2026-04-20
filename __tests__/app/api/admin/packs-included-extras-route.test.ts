import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockGet, mockSave } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGet: vi.fn(),
  mockSave: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/includedExtrasService', () => ({
  getIncludedExtrasMap: mockGet,
  saveIncludedExtrasMap: mockSave,
}));

import { GET, PUT } from '@/app/api/admin/packs/included-extras/route';

describe('GET /api/admin/packs/included-extras', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockGet.mockResolvedValue({ premium: ['foto'] }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(401);
  });

  it('retorna mapa d\'extras', async () => {
    const res = await GET(new NextRequest('http://localhost/x'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.includedByPack).toEqual({ premium: ['foto'] });
  });
});

describe('PUT /api/admin/packs/included-extras', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockSave.mockResolvedValue(undefined); });

  it('guarda mapa d\'extras', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'PUT', body: JSON.stringify({ includedByPack: { premium: ['foto', 'video'] } }), headers: { 'Content-Type': 'application/json' } });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockSave).toHaveBeenCalledWith({ premium: ['foto', 'video'] });
  });
});
