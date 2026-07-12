import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockList, mockCreate, mockToggle } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockToggle: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/discountCodeAdminService', () => ({
  listAdminDiscountCodes: mockList,
  createAdminDiscountCode: mockCreate,
  setAdminDiscountCodeActive: mockToggle,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { GET, PATCH, POST } from '@/app/api/admin/discount-codes/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/discount-codes', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}

function makePatchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/discount-codes', {
    method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/admin/discount-codes', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockList.mockResolvedValue([{ id: 'dc-1', code: 'PROMO10' }]); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/discount-codes'))).status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockList).not.toHaveBeenCalled();
  });

  it('rebutja sense permís de lectura', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/discount-codes'))).status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'read');
    expect(mockList).not.toHaveBeenCalled();
  });

  it('retorna codis', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/discount-codes'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 'dc-1', code: 'PROMO10' }]);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/discount-codes'))).status).toBe(500);
  });
});

describe('POST /api/admin/discount-codes', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockCreate.mockResolvedValue({ status: 201, body: { id: 'dc-2' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const res = await POST(makePostReq({ code: 'X', value: 10, validUntil: '2026-12-31' }));
    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rebutja sense permís de mutació', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const res = await POST(makePostReq({ code: 'PROMO20', value: 20, validUntil: '2026-12-31' }));
    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const res = await POST(makePostReq({ code: 'PROMO20', value: 20, validUntil: '2026-12-31' }));
    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'mutate');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('crea codi correctament', async () => {
    const res = await POST(makePostReq({ code: 'PROMO20', value: 20, validUntil: '2026-12-31' }));
    expect(res.status).toBe(201);
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ code: 'PROMO20', value: 20 }));
  });

  it('rebutja code massa curt', async () => {
    expect((await POST(makePostReq({ code: 'X', value: 10, validUntil: '2026-12-31' }))).status).toBe(400);
  });

  it('rebutja sense validUntil', async () => {
    expect((await POST(makePostReq({ code: 'PROMO', value: 10 }))).status).toBe(400);
  });

  it('rebutja value negatiu', async () => {
    expect((await POST(makePostReq({ code: 'PROMO', value: -5, validUntil: '2026-12-31' }))).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB'));
    expect((await POST(makePostReq({ code: 'PROMO', value: 10, validUntil: '2026-12-31' }))).status).toBe(500);
  });
});

describe('PATCH /api/admin/discount-codes', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockToggle.mockResolvedValue({ status: 200, body: { ok: true, code: { id: 'dc-1' } } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const res = await PATCH(makePatchReq({ id: 'dc-1', isActive: false }));
    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it('rebutja sense permís de mutació', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const res = await PATCH(makePatchReq({ id: 'dc-1', isActive: false }));
    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const res = await PATCH(makePatchReq({ id: 'dc-1', isActive: false }));
    expect(res.status).toBe(403);
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it('actualitza estat del codi', async () => {
    const res = await PATCH(makePatchReq({ id: 'dc-1', isActive: false }));
    expect(res.status).toBe(200);
    expect(mockToggle).toHaveBeenCalledWith({ id: 'dc-1', isActive: false });
  });

  it('rebutja payload invàlid', async () => {
    const res = await PATCH(makePatchReq({ id: 'dc-1' }));
    expect(res.status).toBe(400);
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla', async () => {
    mockToggle.mockRejectedValueOnce(new Error('DB'));
    expect((await PATCH(makePatchReq({ id: 'dc-1', isActive: true }))).status).toBe(500);
  });
});
