import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockUpdateStatus } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockUpdateStatus: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/customerStatusService', () => ({ updateCustomerHubStatus: mockUpdateStatus }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-cs') }));

import { PATCH } from '@/app/api/admin/customers/[id]/status/route';

const ctx = { params: { id: 'c1' } };
function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('PATCH /api/admin/customers/[id]/status', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpdateStatus.mockResolvedValue({ ok: true }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await PATCH(makeReq({ status: 'CONFIRMED' }), ctx)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    expect((await PATCH(makeReq({ status: 'CONFIRMED' }), ctx)).status).toBe(403);
  });

  it('canvia estat', async () => {
    const res = await PATCH(makeReq({ status: 'CONFIRMED' }), ctx);
    expect(res.status).toBe(200);
    expect(mockUpdateStatus).toHaveBeenCalledWith('c1', 'CONFIRMED');
  });

  it('rebutja estat invàlid', async () => {
    expect((await PATCH(makeReq({ status: 'INVALID' }), ctx)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockUpdateStatus.mockRejectedValueOnce(new Error('DB'));
    expect((await PATCH(makeReq({ status: 'LOST' }), ctx)).status).toBe(500);
  });
});
