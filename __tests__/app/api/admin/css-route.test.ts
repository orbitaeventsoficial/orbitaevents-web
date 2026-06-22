import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockGetAdminCustomCss, mockSaveAdminCustomCss } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetAdminCustomCss: vi.fn(),
  mockSaveAdminCustomCss: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/adminCustomCssService', () => ({
  getAdminCustomCss: mockGetAdminCustomCss,
  saveAdminCustomCss: mockSaveAdminCustomCss,
}));

import { GET, PUT } from '@/app/api/admin/css/route';

function req(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/admin/css', {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('/api/admin/css route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetAdminCustomCss.mockResolvedValue('html.admin-mode { color: red; }');
    mockSaveAdminCustomCss.mockResolvedValue({ hadForbiddenRules: false });
  });

  it('GET retorna CSS sense validar CSRF', async () => {
    const res = await GET(req('GET'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, css: 'html.admin-mode { color: red; }' });
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('PUT rebutja sense auth abans de permís i CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('Unauthorized', { status: 401 }));
    const res = await PUT(req('PUT', { css: 'body {}' }));
    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockSaveAdminCustomCss).not.toHaveBeenCalled();
  });

  it('PUT rebutja sense permís abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('Forbidden', { status: 403 }));
    const res = await PUT(req('PUT', { css: 'body {}' }));
    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockSaveAdminCustomCss).not.toHaveBeenCalled();
  });

  it('PUT rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const res = await PUT(req('PUT', { css: 'body {}' }));
    expect(res.status).toBe(403);
    expect(mockSaveAdminCustomCss).not.toHaveBeenCalled();
  });

  it('PUT desa CSS i retorna si ha sanititzat regles prohibides', async () => {
    mockSaveAdminCustomCss.mockResolvedValueOnce({ hadForbiddenRules: true });
    const res = await PUT(req('PUT', { css: 'html.admin-mode .x { color: red; }' }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, sanitized: true });
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'mutate');
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockSaveAdminCustomCss).toHaveBeenCalledWith('html.admin-mode .x { color: red; }');
  });

  it('PUT desa string buit si el body no és JSON vàlid', async () => {
    const badReq = new NextRequest('http://localhost/api/admin/css', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    const res = await PUT(badReq);
    expect(res.status).toBe(200);
    expect(mockSaveAdminCustomCss).toHaveBeenCalledWith('');
  });
});
