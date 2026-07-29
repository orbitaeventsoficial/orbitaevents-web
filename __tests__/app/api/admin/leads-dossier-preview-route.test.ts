import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockBuildDossierHtmlForLeadPreview } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockBuildDossierHtmlForLeadPreview: vi.fn(),
}));

vi.mock('fs', () => ({
  default: { readFileSync: vi.fn(() => '<svg />') },
  readFileSync: vi.fn(() => '<svg />'),
}));
vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/dossierAutoDraftService', () => ({
  buildDossierHtmlForLeadPreview: mockBuildDossierHtmlForLeadPreview,
}));

import { GET } from '@/app/api/admin/leads/[id]/dossier-preview/route';

function makeReq() {
  return new NextRequest('http://localhost:3000/api/admin/leads/lead-1/dossier-preview');
}

describe('GET /api/admin/leads/[id]/dossier-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockBuildDossierHtmlForLeadPreview.mockResolvedValue({
      ok: true,
      html: '<!DOCTYPE html><html><body>Dossier lead</body></html>',
    });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));

    const res = await GET(makeReq(), { params: { id: 'lead-1' } });

    expect(res.status).toBe(401);
    expect(mockBuildDossierHtmlForLeadPreview).not.toHaveBeenCalled();
  });

  it('retorna HTML no-cache amb assets relatius per respectar la CSP self', async () => {
    const res = await GET(makeReq(), { params: { id: 'lead-1' } });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    await expect(res.text()).resolves.toContain('Dossier lead');
    expect(mockBuildDossierHtmlForLeadPreview).toHaveBeenCalledWith('lead-1', expect.objectContaining({
      locale: 'ca-ES',
      logoDataUri: expect.stringContaining('data:image/svg+xml;base64,'),
    }));
    expect(mockBuildDossierHtmlForLeadPreview.mock.calls[0][1]).not.toHaveProperty('assetBaseUrl');
  });

  it('retorna 404 si el lead no existeix', async () => {
    mockBuildDossierHtmlForLeadPreview.mockResolvedValueOnce({ ok: false, error: 'Lead no trobat' });

    const res = await GET(makeReq(), { params: { id: 'missing' } });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Lead no trobat' });
  });
});
