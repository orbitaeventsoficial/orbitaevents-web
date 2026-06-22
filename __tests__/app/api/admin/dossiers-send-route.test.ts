import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockSendDossierByEmail } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockSendDossierByEmail: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/dossierService', () => ({ sendDossierByEmail: mockSendDossierByEmail }));

import { POST } from '@/app/api/admin/dossiers/[id]/send/route';

function makeReq(id = 'dos-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/dossiers/${id}/send`, { method: 'POST' }),
    params: { params: { id } },
  };
}

describe('POST /api/admin/dossiers/[id]/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockSendDossierByEmail.mockResolvedValue({ ok: true });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makeReq();
    expect((await POST(req, params)).status).toBe(401);
    expect(mockSendDossierByEmail).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const { req, params } = makeReq();
    expect((await POST(req, params)).status).toBe(403);
    expect(mockSendDossierByEmail).not.toHaveBeenCalled();
  });

  it('envia el dossier', async () => {
    const { req, params } = makeReq('dos-42');
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mockSendDossierByEmail).toHaveBeenCalledWith('dos-42');
  });

  it('retorna 400 si el servei rebutja', async () => {
    mockSendDossierByEmail.mockResolvedValueOnce({ ok: false, error: 'Sense email' });
    const { req, params } = makeReq();
    const res = await POST(req, params);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Sense email' });
  });
});
