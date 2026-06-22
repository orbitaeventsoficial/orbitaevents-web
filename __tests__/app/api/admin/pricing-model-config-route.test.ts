import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockGetAdminRole,
  mockVerifyCsrf,
  mockGetPackPricingModelConfigEditable,
  mockUpsertPackPricingModelConfig,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockGetAdminRole: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetPackPricingModelConfigEditable: vi.fn(),
  mockUpsertPackPricingModelConfig: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getAdminRole: mockGetAdminRole,
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/packPricingHealth', () => ({
  getPackPricingModelConfigEditable: mockGetPackPricingModelConfigEditable,
  upsertPackPricingModelConfig: mockUpsertPackPricingModelConfig,
}));

import { GET, POST } from '@/app/api/admin/pricing/model-config/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/pricing/model-config', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/pricing/model-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockGetAdminRole.mockReturnValue('admin');
    mockVerifyCsrf.mockReturnValue(null);
    mockGetPackPricingModelConfigEditable.mockResolvedValue({ targetMarginPct: 45 });
    mockUpsertPackPricingModelConfig.mockResolvedValue({ targetMarginPct: 50 });
  });

  it('retorna configuracio sense CSRF en lectura', async () => {
    const req = new NextRequest('http://localhost/api/admin/pricing/model-config');

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      ok: true,
      config: { targetMarginPct: 45 },
    });
  });

  it('rebutja auth abans de permis i CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ config: { targetMarginPct: 50 } }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpsertPackPricingModelConfig).not.toHaveBeenCalled();
  });

  it('rebutja permis abans de CSRF en POST', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await POST(makePostReq({ config: { targetMarginPct: 50 } }));

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpsertPackPricingModelConfig).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o desar en POST', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ config: { targetMarginPct: 50 } });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockGetAdminRole).not.toHaveBeenCalled();
    expect(mockUpsertPackPricingModelConfig).not.toHaveBeenCalled();
  });

  it('desa configuracio amb CSRF valid', async () => {
    const payload = { config: { targetMarginPct: 50 } };
    const req = makePostReq(payload);

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGetAdminRole).toHaveBeenCalledWith(req);
    expect(mockUpsertPackPricingModelConfig).toHaveBeenCalledWith(payload.config, 'admin');
    await expect(res.json()).resolves.toEqual({
      ok: true,
      config: { targetMarginPct: 50 },
    });
  });

  it('retorna 500 si falla el servei', async () => {
    mockUpsertPackPricingModelConfig.mockRejectedValueOnce(new Error('DB'));

    const res = await POST(makePostReq({ config: { targetMarginPct: 50 } }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "No s'ha pogut actualitzar la configuració econòmica dels packs",
    });
  });
});
