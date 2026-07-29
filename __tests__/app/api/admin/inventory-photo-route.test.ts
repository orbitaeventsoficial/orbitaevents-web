import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockUpload, mockDeletePhoto } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockUpload: vi.fn(),
  mockDeletePhoto: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/inventoryAdminService', () => ({
  uploadInventoryItemPhoto: mockUpload,
  deleteInventoryItemPhoto: mockDeletePhoto,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { POST, DELETE } from '@/app/api/admin/inventory/[id]/photo/route';

const ctx = { params: { id: 'i1' } };

describe('POST /api/admin/inventory/[id]/photo', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpload.mockResolvedValue({ status: 200, body: { imageUrl: '/uploads/photo.jpg' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    // Use a plain request — formData parsing is skipped when auth fails
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }), ctx)).status).toBe(401);
  });

  it('puja foto (mock formData)', async () => {
    const fakeFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const fakeFormData = new FormData();
    fakeFormData.append('file', fakeFile);
    // Build a request and override formData() to avoid the NextRequest+FormData hang
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    req.formData = vi.fn().mockResolvedValue(fakeFormData);
    const res = await POST(req, ctx);
    expect(res.status).toBe(200);
    expect(mockUpload).toHaveBeenCalledWith('i1', fakeFile);
  });

  it('retorna 500 si falla', async () => {
    mockUpload.mockRejectedValueOnce(new Error('FS'));
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    req.formData = vi.fn().mockResolvedValue(new FormData());
    expect((await POST(req, ctx)).status).toBe(500);
  });
});

describe('DELETE /api/admin/inventory/[id]/photo', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockDeletePhoto.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('elimina foto', async () => {
    expect((await DELETE(new NextRequest('http://localhost/x', { method: 'DELETE' }), ctx)).status).toBe(200);
    expect(mockDeletePhoto).toHaveBeenCalledWith('i1');
  });

  it('retorna 500 si falla', async () => {
    mockDeletePhoto.mockRejectedValueOnce(new Error('FS'));
    expect((await DELETE(new NextRequest('http://localhost/x', { method: 'DELETE' }), ctx)).status).toBe(500);
  });
});
