import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockListMarketingSpend,
  mockUpsertMarketingSpend,
  mockDeleteMarketingSpend,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListMarketingSpend: vi.fn(),
  mockUpsertMarketingSpend: vi.fn(),
  mockDeleteMarketingSpend: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/marketingSpendService', () => ({
  listMarketingSpend: mockListMarketingSpend,
  upsertMarketingSpend: mockUpsertMarketingSpend,
  deleteMarketingSpend: mockDeleteMarketingSpend,
}));

import { DELETE, GET, POST } from '@/app/api/admin/marketing/spend/route';

function makeReq(method: string, body?: Record<string, unknown>, url = 'http://localhost/api/admin/marketing/spend') {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

describe('/api/admin/marketing/spend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListMarketingSpend.mockResolvedValue([{ id: 'spend-1', channel: 'GOOGLE', amount: 50 }]);
    mockUpsertMarketingSpend.mockResolvedValue({ id: 'spend-2', channel: 'GOOGLE', amount: 100 });
    mockDeleteMarketingSpend.mockResolvedValue(undefined);
  });

  it('GET exigeix permis read i no CSRF', async () => {
    const req = makeReq('GET');

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      entries: [{ id: 'spend-1', channel: 'GOOGLE', amount: 50 }],
    });
  });

  it('GET rebutja sense permis read', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('GET');

    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(mockListMarketingSpend).not.toHaveBeenCalled();
  });

  it('POST rebutja permis abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('POST', { channel: 'GOOGLE', year: 2026, month: 7, amount: 100 });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpsertMarketingSpend).not.toHaveBeenCalled();
  });

  it('POST rebutja CSRF abans de llegir body o mutar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('POST', { channel: 'GOOGLE', year: 2026, month: 7, amount: 100 });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpsertMarketingSpend).not.toHaveBeenCalled();
  });

  it('POST desa despesa amb permis mutate', async () => {
    const payload = { channel: 'GOOGLE', year: 2026, month: 7, amount: 100, notes: 'ads' };
    const req = makeReq('POST', payload);

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockUpsertMarketingSpend).toHaveBeenCalledWith(payload);
    await expect(res.json()).resolves.toEqual({
      entry: { id: 'spend-2', channel: 'GOOGLE', amount: 100 },
    });
  });

  it('DELETE rebutja permis abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('DELETE', undefined, 'http://localhost/api/admin/marketing/spend?id=spend-1');

    const res = await DELETE(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockDeleteMarketingSpend).not.toHaveBeenCalled();
  });

  it('DELETE elimina despesa amb permis mutate', async () => {
    const req = makeReq('DELETE', undefined, 'http://localhost/api/admin/marketing/spend?id=spend-1');

    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockDeleteMarketingSpend).toHaveBeenCalledWith('spend-1');
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
