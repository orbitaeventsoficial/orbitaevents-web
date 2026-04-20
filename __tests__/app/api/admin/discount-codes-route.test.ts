import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockList, mockCreate } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/discountCodeAdminService', () => ({
  listAdminDiscountCodes: mockList,
  createAdminDiscountCode: mockCreate,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { GET, POST } from '@/app/api/admin/discount-codes/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/discount-codes', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/admin/discount-codes', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockList.mockResolvedValue([{ id: 'dc-1', code: 'PROMO10' }]); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/discount-codes'))).status).toBe(401);
  });

  it('retorna codis', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/discount-codes'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 'dc-1', code: 'PROMO10' }]);
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/discount-codes'))).status).toBe(500);
  });
});

describe('POST /api/admin/discount-codes', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockCreate.mockResolvedValue({ status: 201, body: { id: 'dc-2' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(makePostReq({ code: 'X', value: 10, validUntil: '2026-12-31' }))).status).toBe(401);
  });

  it('crea codi correctament', async () => {
    const res = await POST(makePostReq({ code: 'PROMO20', value: 20, validUntil: '2026-12-31' }));
    expect(res.status).toBe(201);
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
