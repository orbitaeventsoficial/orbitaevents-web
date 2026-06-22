import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockCreateAdminSetting,
  mockListAdminSettings,
  mockUpdateAdminSettings,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateAdminSetting: vi.fn(),
  mockListAdminSettings: vi.fn(),
  mockUpdateAdminSettings: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/adminSettingsService', () => ({
  createAdminSetting: mockCreateAdminSetting,
  listAdminSettings: mockListAdminSettings,
  updateAdminSettings: mockUpdateAdminSettings,
}));

import { GET, POST, PUT } from '@/app/api/admin/settings/route';

function makeReq(method: 'POST' | 'PUT', body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/settings', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateAdminSetting.mockResolvedValue({ key: 'company_name', category: 'company' });
    mockListAdminSettings.mockResolvedValue({
      settings: [{ key: 'company_name', value: 'Orbita' }],
      raw: [{ key: 'company_name', value: 'Orbita' }],
    });
    mockUpdateAdminSettings.mockResolvedValue([{ key: 'company_name', value: 'Orbita' }]);
  });

  it('llista settings sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/settings?category=company'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListAdminSettings).toHaveBeenCalledWith('company');
    await expect(res.json()).resolves.toEqual({
      ok: true,
      settings: [{ key: 'company_name', value: 'Orbita' }],
      raw: [{ key: 'company_name', value: 'Orbita' }],
    });
  });

  it('rebutja auth abans de CSRF en PUT', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await PUT(makeReq('PUT', { settings: [] }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdateAdminSettings).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o actualitzar en PUT', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('PUT', { settings: [{ key: 'company_name', value: 'Orbita' }] });

    const res = await PUT(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdateAdminSettings).not.toHaveBeenCalled();
  });

  it('actualitza settings amb CSRF valid', async () => {
    const payload = { settings: [{ key: 'company_name', value: 'Orbita' }] };

    const res = await PUT(makeReq('PUT', payload));

    expect(res.status).toBe(200);
    expect(mockUpdateAdminSettings).toHaveBeenCalledWith(payload.settings);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      updated: [{ key: 'company_name', value: 'Orbita' }],
    });
  });

  it('retorna 400 si PUT no porta array de settings', async () => {
    const res = await PUT(makeReq('PUT', { settings: null }));

    expect(res.status).toBe(400);
    expect(mockUpdateAdminSettings).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o crear en POST', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('POST', { key: 'company_name', category: 'company', value: 'Orbita' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreateAdminSetting).not.toHaveBeenCalled();
  });

  it('crea setting amb CSRF valid', async () => {
    const payload = {
      key: 'company_name',
      category: 'company',
      value: 'Orbita',
      type: 'STRING',
      label: 'Nom empresa',
      description: 'Nom visible',
    };

    const res = await POST(makeReq('POST', payload));

    expect(res.status).toBe(200);
    expect(mockCreateAdminSetting).toHaveBeenCalledWith(payload);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      setting: { key: 'company_name', category: 'company' },
    });
  });

  it('retorna 400 si POST no porta key o category', async () => {
    const res = await POST(makeReq('POST', { key: 'company_name' }));

    expect(res.status).toBe(400);
    expect(mockCreateAdminSetting).not.toHaveBeenCalled();
  });
});
