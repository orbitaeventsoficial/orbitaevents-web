import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockListCrewBlocks,
  mockCreateCrewBlock,
  mockDeleteCrewBlock,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListCrewBlocks: vi.fn(),
  mockCreateCrewBlock: vi.fn(),
  mockDeleteCrewBlock: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/services/crewScheduleService', () => ({
  createCrewBlock: mockCreateCrewBlock,
  deleteCrewBlock: mockDeleteCrewBlock,
  listCrewBlocks: mockListCrewBlocks,
}));

import { DELETE, GET, POST } from '@/app/api/admin/cuadrant/blocks/route';

describe('GET /api/admin/cuadrant/blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListCrewBlocks.mockResolvedValue([{ id: 'block-1' }]);
  });

  it('retorna bloquejos sense exigir CSRF', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/cuadrant/blocks'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ blocks: [{ id: 'block-1' }] });
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/cuadrant/blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateCrewBlock.mockResolvedValue({ status: 201, body: { ok: true, block: { id: 'block-1' } } });
  });

  it('rebutja sense auth abans de validar CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(new NextRequest('http://localhost/api/admin/cuadrant/blocks', { method: 'POST' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateCrewBlock).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF abans de llegir el body o crear', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/cuadrant/blocks', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-07-01' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockCreateCrewBlock).not.toHaveBeenCalled();
  });

  it('crea bloqueig amb CSRF vàlid', async () => {
    const payload = { date: '2026-07-01' };
    const req = new NextRequest('http://localhost/api/admin/cuadrant/blocks', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreateCrewBlock).toHaveBeenCalledWith(payload);
  });
});

describe('DELETE /api/admin/cuadrant/blocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockDeleteCrewBlock.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense CSRF abans d\'eliminar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/cuadrant/blocks?id=block-1', { method: 'DELETE' });

    const res = await DELETE(req);

    expect(res.status).toBe(403);
    expect(mockDeleteCrewBlock).not.toHaveBeenCalled();
  });

  it('elimina bloqueig amb CSRF vàlid', async () => {
    const req = new NextRequest('http://localhost/api/admin/cuadrant/blocks?id=block-1', { method: 'DELETE' });

    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockDeleteCrewBlock).toHaveBeenCalledWith('block-1');
  });
});
