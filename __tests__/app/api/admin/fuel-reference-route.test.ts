import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockGetFuelReference,
  mockRefreshFuelReference,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetFuelReference: vi.fn(),
  mockRefreshFuelReference: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/services/fuelReferenceService', () => ({
  getFuelCostPerKmReference: mockGetFuelReference,
  refreshFuelReferenceNow: mockRefreshFuelReference,
}));

import { GET, POST } from '@/app/api/admin/fuel/reference/route';

describe('GET /api/admin/fuel/reference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetFuelReference.mockResolvedValue({ costPerKm: 0.12, source: 'manual' });
  });

  it('rebutja sense auth abans de permisos o CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await GET(new NextRequest('http://localhost/api/admin/fuel/reference'));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetFuelReference).not.toHaveBeenCalled();
  });

  it('retorna la referència amb permís de lectura sense exigir CSRF', async () => {
    const req = new NextRequest('http://localhost/api/admin/fuel/reference');
    const res = await GET(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      costPerKm: 0.12,
      source: 'manual',
    });
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/fuel/reference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRefreshFuelReference.mockResolvedValue({ costPerKm: 0.14, source: 'refreshed' });
  });

  it('rebutja sense auth abans de permisos o CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(new NextRequest('http://localhost/api/admin/fuel/reference', { method: 'POST' }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockRefreshFuelReference).not.toHaveBeenCalled();
  });

  it('rebutja sense permís mutate abans de validar CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const req = new NextRequest('http://localhost/api/admin/fuel/reference', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockRefreshFuelReference).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF abans de refrescar la referència', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const req = new NextRequest('http://localhost/api/admin/fuel/reference', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockRefreshFuelReference).not.toHaveBeenCalled();
  });

  it('refresca la referència amb CSRF vàlid', async () => {
    const req = new NextRequest('http://localhost/api/admin/fuel/reference', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      costPerKm: 0.14,
      source: 'refreshed',
    });
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockRefreshFuelReference).toHaveBeenCalledTimes(1);
  });
});
