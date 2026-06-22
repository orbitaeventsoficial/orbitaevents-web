import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetConfig, mockSaveConfig } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetConfig: vi.fn(),
  mockSaveConfig: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/extrasConfiguratorService', () => ({
  getExtrasConfiguratorConfig: mockGetConfig,
  saveExtrasConfiguratorConfig: mockSaveConfig,
}));

import { GET, PUT } from '@/app/api/admin/extras/route';

describe('GET /api/admin/extras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetConfig.mockResolvedValue({
      config: [{ id: 'low-fog', name: 'Fum baix' }],
      isDefault: false,
    });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await GET(new NextRequest('http://localhost/api/admin/extras'));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('retorna la configuració sense exigir CSRF', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/extras'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      config: [{ id: 'low-fog', name: 'Fum baix' }],
      isDefault: false,
    });
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });
});

describe('PUT /api/admin/extras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockSaveConfig.mockResolvedValue(undefined);
  });

  it('rebutja sense auth abans de validar CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const req = new NextRequest('http://localhost/api/admin/extras', {
      method: 'PUT',
      body: JSON.stringify({ config: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req);

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF abans de llegir el body o guardar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const req = new NextRequest('http://localhost/api/admin/extras', {
      method: 'PUT',
      body: JSON.stringify({ config: [{ id: 'low-fog', name: 'Fum baix' }] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PUT(req);

    expect(res.status).toBe(403);
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });

  it('retorna 400 si la configuració no és una llista', async () => {
    const req = new NextRequest('http://localhost/api/admin/extras', {
      method: 'PUT',
      body: JSON.stringify({ config: { id: 'low-fog' } }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req);

    expect(res.status).toBe(400);
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockSaveConfig).not.toHaveBeenCalled();
  });

  it('guarda la configuració amb CSRF vàlid', async () => {
    const config = [{ id: 'low-fog', name: 'Fum baix' }];
    const req = new NextRequest('http://localhost/api/admin/extras', {
      method: 'PUT',
      body: JSON.stringify({ config }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockSaveConfig).toHaveBeenCalledWith(config);
  });
});
