import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockDeleteAsset,
  mockGetPayload,
  mockReorderAssets,
  mockSaveModifications,
  mockUploadAsset,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockDeleteAsset: vi.fn(),
  mockGetPayload: vi.fn(),
  mockReorderAssets: vi.fn(),
  mockSaveModifications: vi.fn(),
  mockUploadAsset: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/imageManagerService', () => ({
  deleteImageManagerAsset: mockDeleteAsset,
  getImageManagerPayload: mockGetPayload,
  reorderImageManagerAssets: mockReorderAssets,
  saveImageManagerModifications: mockSaveModifications,
  uploadImageManagerAsset: mockUploadAsset,
}));

import { DELETE, GET, PATCH, POST, PUT } from '@/app/api/admin/image-manager/route';

function jsonReq(method: 'PUT' | 'PATCH' | 'DELETE', body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/image-manager', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function formReq() {
  const formData = new FormData();
  return new NextRequest('http://localhost/api/admin/image-manager', { method: 'POST', body: formData });
}

describe('/api/admin/image-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetPayload.mockResolvedValue({ sections: [] });
    mockSaveModifications.mockResolvedValue({ status: 200, body: { ok: true } });
    mockReorderAssets.mockResolvedValue(undefined);
    mockDeleteAsset.mockResolvedValue(undefined);
    mockUploadAsset.mockResolvedValue({ id: 'asset-1' });
  });

  it('retorna payload sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/image-manager'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ sections: [] });
  });

  it('rebutja permís abans de CSRF en PUT', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await PUT(jsonReq('PUT', { modifications: {} }));

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de desar modificacions', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = jsonReq('PUT', { modifications: {} });

    const res = await PUT(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockSaveModifications).not.toHaveBeenCalled();
  });

  it('desa modificacions amb CSRF valid', async () => {
    const payload = { modifications: { hero: { mode: 'manual' } } };
    const req = jsonReq('PUT', payload);

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(mockSaveModifications).toHaveBeenCalledWith(payload);
  });

  it('rebutja CSRF abans de llegir form-data en POST', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = formReq();

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockUploadAsset).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de reordenar en PATCH', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = jsonReq('PATCH', { key: 'home.hero.slides', items: [{ id: 'a', sortOrder: 0 }] });

    const res = await PATCH(req);

    expect(res.status).toBe(403);
    expect(mockReorderAssets).not.toHaveBeenCalled();
  });

  it('reordena amb CSRF valid', async () => {
    const body = { key: 'home.hero.slides', items: [{ id: 'a', sortOrder: 0 }] };
    const req = jsonReq('PATCH', body);

    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(mockReorderAssets).toHaveBeenCalledWith(body);
  });

  it('rebutja CSRF abans deliminar en DELETE', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = jsonReq('DELETE', { key: 'home.hero.slides', assetId: 'a' });

    const res = await DELETE(req);

    expect(res.status).toBe(403);
    expect(mockDeleteAsset).not.toHaveBeenCalled();
  });

  it('elimina amb CSRF valid', async () => {
    const req = jsonReq('DELETE', { key: 'home.hero.slides', assetId: 'a' });

    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockDeleteAsset).toHaveBeenCalledWith({ key: 'home.hero.slides', assetId: 'a' });
  });
});
