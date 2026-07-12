import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockGetPricingAdminData,
  mockNormalizePricingLocale,
  mockUpdateExtraPrice,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetPricingAdminData: vi.fn(),
  mockNormalizePricingLocale: vi.fn(),
  mockUpdateExtraPrice: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/pricingAdminService', () => ({
  getPricingAdminData: mockGetPricingAdminData,
  normalizePricingLocale: mockNormalizePricingLocale,
  updateExtraPrice: mockUpdateExtraPrice,
}));

import { GET, PUT } from '@/app/api/admin/pricing/route';

function makePutReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/pricing', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockNormalizePricingLocale.mockReturnValue('ca');
    mockGetPricingAdminData.mockResolvedValue({ extras: [{ id: 'extra-1', price: 120 }] });
    mockUpdateExtraPrice.mockResolvedValue({
      status: 200,
      body: { ok: true, extra: { id: 'extra-1', price: 140 } },
    });
  });

  it('retorna dades de pricing sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/pricing?locale=ca'));

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockNormalizePricingLocale).toHaveBeenCalledWith('ca');
    expect(mockGetPricingAdminData).toHaveBeenCalledWith('ca');
    await expect(res.json()).resolves.toEqual({
      extras: [{ id: 'extra-1', price: 120 }],
    });
  });

  it('rebutja permisos de lectura abans de carregar dades', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await GET(new NextRequest('http://localhost/api/admin/pricing?locale=ca'));

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetPricingAdminData).not.toHaveBeenCalled();
  });

  it('rebutja auth abans de CSRF en PUT', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await PUT(makePutReq({ extraId: 'extra-1', price: 140 }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdateExtraPrice).not.toHaveBeenCalled();
  });

  it('rebutja permisos de mutacio abans de CSRF o body en PUT', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePutReq({ extraId: 'extra-1', price: 140 });

    const res = await PUT(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdateExtraPrice).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o actualitzar preu', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePutReq({ extraId: 'extra-1', price: 140 });

    const res = await PUT(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdateExtraPrice).not.toHaveBeenCalled();
  });

  it('actualitza preu amb CSRF valid', async () => {
    const res = await PUT(makePutReq({ extraId: 'extra-1', price: 140 }));

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'mutate');
    expect(mockUpdateExtraPrice).toHaveBeenCalledWith('extra-1', 140);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      extra: { id: 'extra-1', price: 140 },
    });
  });

  it('propaga status funcional del servei', async () => {
    mockUpdateExtraPrice.mockResolvedValueOnce({
      status: 400,
      body: { error: 'Preu invalid' },
    });

    const res = await PUT(makePutReq({ extraId: 'extra-1', price: -1 }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Preu invalid' });
  });

  it('retorna 500 si falla el servei', async () => {
    mockUpdateExtraPrice.mockRejectedValueOnce(new Error('DB'));

    const res = await PUT(makePutReq({ extraId: 'extra-1', price: 140 }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Error actualitzant preu' });
  });
});
