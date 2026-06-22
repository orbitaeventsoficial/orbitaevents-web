import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockCreateDossier } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateDossier: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/dossierService', () => ({ createDossier: mockCreateDossier }));

import { POST } from '@/app/api/admin/dossiers/route';

function makeReq(body: Record<string, unknown> = { nom: 'Dossier', productIds: ['p1'] }) {
  return new NextRequest('http://localhost/api/admin/dossiers', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/dossiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateDossier.mockResolvedValue({ id: 'dos-1', nom: 'Dossier' });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(makeReq())).status).toBe(401);
    expect(mockCreateDossier).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    expect((await POST(makeReq())).status).toBe(403);
    expect(mockCreateDossier).not.toHaveBeenCalled();
  });

  it('valida nom requerit abans de crear', async () => {
    const res = await POST(makeReq({ nom: ' ', productIds: ['p1'] }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Nom requerit' });
    expect(mockCreateDossier).not.toHaveBeenCalled();
  });

  it('valida productes requerits abans de crear', async () => {
    const res = await POST(makeReq({ nom: 'Dossier', productIds: [] }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Cal seleccionar almenys un producte' });
    expect(mockCreateDossier).not.toHaveBeenCalled();
  });

  it('crea dossier amb CSRF valid', async () => {
    const res = await POST(makeReq({ nom: 'Dossier', productIds: ['p1'] }));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ id: 'dos-1', nom: 'Dossier' });
    expect(mockCreateDossier).toHaveBeenCalledWith({ nom: 'Dossier', productIds: ['p1'] });
  });
});
