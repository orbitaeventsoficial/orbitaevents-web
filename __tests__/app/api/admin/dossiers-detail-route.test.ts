import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockGetDossierById,
  mockSoftDeleteDossier,
  mockRestoreDossier,
  mockPurgeDossier,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetDossierById: vi.fn(),
  mockSoftDeleteDossier: vi.fn(),
  mockRestoreDossier: vi.fn(),
  mockPurgeDossier: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/dossierService', () => ({
  getDossierById: mockGetDossierById,
  softDeleteDossier: mockSoftDeleteDossier,
  restoreDossier: mockRestoreDossier,
  purgeDossier: mockPurgeDossier,
}));

import { DELETE, GET, PATCH } from '@/app/api/admin/dossiers/[id]/route';

function makeReq(method: 'GET' | 'PATCH' | 'DELETE', body?: Record<string, unknown>) {
  return {
    req: new NextRequest('http://localhost/api/admin/dossiers/dos-1', {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
    }),
    params: { params: { id: 'dos-1' } },
  };
}

describe('GET /api/admin/dossiers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetDossierById.mockResolvedValue({ id: 'dos-1', nom: 'Dossier' });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makeReq('GET');
    expect((await GET(req, params)).status).toBe(401);
  });

  it('retorna dossier sense exigir CSRF', async () => {
    const { req, params } = makeReq('GET');
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetDossierById).toHaveBeenCalledWith('dos-1');
  });

  it('retorna 404 si no existeix', async () => {
    mockGetDossierById.mockResolvedValueOnce(null);
    const { req, params } = makeReq('GET');
    expect((await GET(req, params)).status).toBe(404);
  });
});

describe('DELETE /api/admin/dossiers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockSoftDeleteDossier.mockResolvedValue(undefined);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const { req, params } = makeReq('DELETE');
    expect((await DELETE(req, params)).status).toBe(403);
    expect(mockSoftDeleteDossier).not.toHaveBeenCalled();
  });

  it('envia dossier a paperera', async () => {
    const { req, params } = makeReq('DELETE');
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    expect(mockSoftDeleteDossier).toHaveBeenCalledWith('dos-1');
  });
});

describe('PATCH /api/admin/dossiers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRestoreDossier.mockResolvedValue(undefined);
    mockPurgeDossier.mockResolvedValue(undefined);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const { req, params } = makeReq('PATCH', { action: 'restore' });
    expect((await PATCH(req, params)).status).toBe(403);
    expect(mockRestoreDossier).not.toHaveBeenCalled();
  });

  it('restaura dossier', async () => {
    const { req, params } = makeReq('PATCH', { action: 'restore' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockRestoreDossier).toHaveBeenCalledWith('dos-1');
  });

  it('purga dossier', async () => {
    const { req, params } = makeReq('PATCH', { action: 'purge' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockPurgeDossier).toHaveBeenCalledWith('dos-1');
  });

  it('rebutja accio desconeguda', async () => {
    const { req, params } = makeReq('PATCH', { action: 'other' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Acció desconeguda' });
  });
});
