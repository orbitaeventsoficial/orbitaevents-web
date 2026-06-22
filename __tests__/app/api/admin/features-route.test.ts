import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockListAdminFeatures,
  mockUpdateAdminFeature,
  mockIsAdminFeatureKey,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListAdminFeatures: vi.fn(),
  mockUpdateAdminFeature: vi.fn(),
  mockIsAdminFeatureKey: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/services/adminFeaturesService', () => ({
  isAdminFeatureKey: mockIsAdminFeatureKey,
  listAdminFeatures: mockListAdminFeatures,
  updateAdminFeature: mockUpdateAdminFeature,
}));

import { GET, POST } from '@/app/api/admin/features/route';

describe('GET /api/admin/features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListAdminFeatures.mockResolvedValue([
      { key: 'features.blog_enabled', enabled: true },
    ]);
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await GET(new NextRequest('http://localhost/api/admin/features'));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListAdminFeatures).not.toHaveBeenCalled();
  });

  it('retorna features sense exigir CSRF', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/features'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      features: [{ key: 'features.blog_enabled', enabled: true }],
    });
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockIsAdminFeatureKey.mockReturnValue(true);
    mockUpdateAdminFeature.mockResolvedValue(undefined);
  });

  it('rebutja sense auth abans de validar CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const req = new NextRequest('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({ key: 'features.blog_enabled', enabled: false }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdateAdminFeature).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF abans de llegir el body o guardar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const req = new NextRequest('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({ key: 'features.blog_enabled', enabled: false }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockUpdateAdminFeature).not.toHaveBeenCalled();
  });

  it('retorna 400 si falten key o enabled', async () => {
    const req = new NextRequest('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({ key: 'features.blog_enabled' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockUpdateAdminFeature).not.toHaveBeenCalled();
  });

  it('retorna 400 si la key no és canònica', async () => {
    mockIsAdminFeatureKey.mockReturnValueOnce(false);
    const req = new NextRequest('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({ key: 'features.invalid', enabled: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockUpdateAdminFeature).not.toHaveBeenCalled();
  });

  it('actualitza una feature amb CSRF vàlid', async () => {
    const req = new NextRequest('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({ key: 'features.blog_enabled', enabled: false }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      message: 'Funcionalitat actualitzada correctament',
    });
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockUpdateAdminFeature).toHaveBeenCalledWith({
      key: 'features.blog_enabled',
      enabled: false,
    });
  });
});
