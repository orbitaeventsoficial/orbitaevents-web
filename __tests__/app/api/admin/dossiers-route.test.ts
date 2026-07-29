import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockCreateDossier, mockCreateDossierDraftFromLead } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateDossier: vi.fn(),
  mockCreateDossierDraftFromLead: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/dossierService', () => ({ createDossier: mockCreateDossier }));
vi.mock('@/lib/services/dossierAutoDraftService', () => ({
  createDossierDraftFromLead: mockCreateDossierDraftFromLead,
}));

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
    mockCreateDossierDraftFromLead.mockResolvedValue({
      ok: true,
      status: 'created',
      dossierId: 'dos-lead-1',
      productIds: ['p1'],
      productNames: ['Bingo Musical'],
    });
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

  it('retira la creacio directa sense leadId', async () => {
    const res = await POST(makeReq({ nom: ' ', productIds: ['p1'] }));
    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('requereix leadId'),
      canonicalRoute: '/admin/dossiers?leadId=...',
    });
    expect(mockCreateDossier).not.toHaveBeenCalled();
    expect(mockCreateDossierDraftFromLead).not.toHaveBeenCalled();
  });

  it('no crea dossier directe encara que el payload antic sigui valid', async () => {
    const res = await POST(makeReq({ nom: 'Dossier', productIds: ['p1'] }));
    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toMatchObject({ canonicalRoute: '/admin/dossiers?leadId=...' });
    expect(mockCreateDossier).not.toHaveBeenCalled();
    expect(mockCreateDossierDraftFromLead).not.toHaveBeenCalled();
  });

  it('delega en el contracte canonic quan arriba leadId', async () => {
    const res = await POST(makeReq({ leadId: 'lead-1' }));

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      id: 'dos-lead-1',
      dossierId: 'dos-lead-1',
      status: 'created',
    });
    expect(mockCreateDossierDraftFromLead).toHaveBeenCalledWith('lead-1');
    expect(mockCreateDossier).not.toHaveBeenCalled();
  });

  it('reutilitza el dossier actiu del lead amb estat 200', async () => {
    mockCreateDossierDraftFromLead.mockResolvedValueOnce({
      ok: true,
      status: 'existing',
      dossierId: 'dos-existing',
      productIds: ['p1'],
      productNames: ['Bingo Musical'],
    });

    const res = await POST(makeReq({ leadId: 'lead-1' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      id: 'dos-existing',
      dossierId: 'dos-existing',
      status: 'existing',
    });
    expect(mockCreateDossier).not.toHaveBeenCalled();
  });

  it('propaga errors del contracte canonic de lead', async () => {
    mockCreateDossierDraftFromLead.mockResolvedValueOnce({ ok: false, error: 'Lead no trobat' });

    const res = await POST(makeReq({ leadId: 'lead-inexistent' }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Lead no trobat' });
    expect(mockCreateDossier).not.toHaveBeenCalled();
  });
});
