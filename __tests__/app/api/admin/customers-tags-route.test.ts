import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockAdd, mockRemove, mockSet } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockAdd: vi.fn(),
  mockRemove: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/customerSegmentationService', () => ({
  addCustomerTags: mockAdd,
  removeCustomerTags: mockRemove,
  setCustomerTags: mockSet,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { PATCH } from '@/app/api/admin/customers/[id]/tags/route';

const ctx = { params: { id: 'c1' } };
function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('PATCH /api/admin/customers/[id]/tags', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockAdd.mockResolvedValue({ tags: ['vip'] }); mockRemove.mockResolvedValue({ tags: [] }); mockSet.mockResolvedValue({ tags: ['premium'] }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await PATCH(makeReq({ action: 'add', tags: ['vip'] }), ctx)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    expect((await PATCH(makeReq({ action: 'add', tags: ['vip'] }), ctx)).status).toBe(403);
  });

  it('afegeix tags', async () => {
    const res = await PATCH(makeReq({ action: 'add', tags: ['vip'] }), ctx);
    expect(res.status).toBe(200);
    expect(mockAdd).toHaveBeenCalledWith('c1', ['vip']);
  });

  it('elimina tags', async () => {
    await PATCH(makeReq({ action: 'remove', tags: ['old'] }), ctx);
    expect(mockRemove).toHaveBeenCalledWith('c1', ['old']);
  });

  it('substitueix tags', async () => {
    await PATCH(makeReq({ action: 'set', tags: ['premium'] }), ctx);
    expect(mockSet).toHaveBeenCalledWith('c1', ['premium']);
  });

  it('rebutja acció invàlida', async () => {
    expect((await PATCH(makeReq({ action: 'invalid', tags: ['x'] }), ctx)).status).toBe(400);
  });

  it('rebutja tags buits', async () => {
    expect((await PATCH(makeReq({ action: 'add', tags: [] }), ctx)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockAdd.mockRejectedValueOnce(new Error('DB'));
    expect((await PATCH(makeReq({ action: 'add', tags: ['x'] }), ctx)).status).toBe(500);
  });
});
