import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockBuildDossierHtmlForDossier } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockBuildDossierHtmlForDossier: vi.fn(),
}));

vi.mock('fs', () => ({
  default: { readFileSync: vi.fn(() => '<svg />') },
  readFileSync: vi.fn(() => '<svg />'),
}));
vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/dossierService', () => ({
  buildDossierHtmlForDossier: mockBuildDossierHtmlForDossier,
}));

import { GET } from '@/app/api/admin/dossiers/[id]/preview/route';

function makeReq() {
  return new NextRequest('http://localhost:3000/api/admin/dossiers/dos-1/preview');
}

describe('GET /api/admin/dossiers/[id]/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockBuildDossierHtmlForDossier.mockResolvedValue({ html: '<!DOCTYPE html><html><body>Dossier</body></html>' });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));

    const res = await GET(makeReq(), { params: { id: 'dos-1' } });

    expect(res.status).toBe(401);
    expect(mockBuildDossierHtmlForDossier).not.toHaveBeenCalled();
  });

  it('retorna HTML no-cache amb assets relatius per respectar la CSP self', async () => {
    const res = await GET(makeReq(), { params: { id: 'dos-1' } });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    await expect(res.text()).resolves.toContain('Dossier');
    expect(mockBuildDossierHtmlForDossier).toHaveBeenCalledWith('dos-1', expect.objectContaining({
      locale: 'ca-ES',
      logoDataUri: expect.stringContaining('data:image/svg+xml;base64,'),
    }));
    expect(mockBuildDossierHtmlForDossier.mock.calls[0][1]).not.toHaveProperty('assetBaseUrl');
  });

  it('retorna 404 si el dossier no existeix', async () => {
    mockBuildDossierHtmlForDossier.mockResolvedValueOnce(null);

    const res = await GET(makeReq(), { params: { id: 'missing' } });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'No trobat' });
  });
});
