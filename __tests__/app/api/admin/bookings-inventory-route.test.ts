import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetView, mockAssign, mockUpdate, mockRemove } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetView: vi.fn(),
  mockAssign: vi.fn(),
  mockUpdate: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/bookingInventoryService', () => ({
  getBookingInventoryView: mockGetView,
  assignBookingInventory: mockAssign,
  updateBookingInventoryAssignment: mockUpdate,
  removeBookingInventoryAssignment: mockRemove,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, POST, PATCH, DELETE } from '@/app/api/admin/bookings/[id]/inventory/route';

function makeGetReq(id = 'book-1') {
  return { req: new NextRequest(`http://localhost/api/admin/bookings/${id}/inventory`), params: { params: { id } } };
}
function makePostReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/inventory`, {
      method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}
function makePatchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/bookings/book-1/inventory', {
    method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}
function makeDeleteReq(assignmentId?: string) {
  const url = assignmentId
    ? `http://localhost/api/admin/bookings/book-1/inventory?assignmentId=${assignmentId}`
    : 'http://localhost/api/admin/bookings/book-1/inventory';
  return new NextRequest(url, { method: 'DELETE' });
}

describe('GET /api/admin/bookings/[id]/inventory', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockGetView.mockResolvedValue({ status: 200, body: { items: [] } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(makeGetReq().req, makeGetReq().params)).status).toBe(401);
  });

  it('retorna inventari', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
  });

  it('passa id i url', async () => {
    const { req, params } = makeGetReq('book-xyz');
    await GET(req, params);
    expect(mockGetView).toHaveBeenCalledWith('book-xyz', expect.stringContaining('book-xyz'));
  });

  it('retorna 500 si falla', async () => {
    mockGetView.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeGetReq();
    expect((await GET(req, params)).status).toBe(500);
  });
});

describe('POST /api/admin/bookings/[id]/inventory', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockAssign.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makePostReq('book-1', { itemId: 'inv-1' });
    expect((await POST(req, params)).status).toBe(401);
  });

  it('assigna element', async () => {
    const { req, params } = makePostReq('book-1', { itemId: 'inv-1', quantity: 2 });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockAssign).toHaveBeenCalledWith('book-1', { itemId: 'inv-1', quantity: 2 });
  });

  it('retorna 500 si falla', async () => {
    mockAssign.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq('book-1', {});
    expect((await POST(req, params)).status).toBe(500);
  });
});

describe('PATCH /api/admin/bookings/[id]/inventory', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpdate.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await PATCH(makePatchReq({ assignmentId: 'a-1' }))).status).toBe(401);
  });

  it('actualitza assignació', async () => {
    const res = await PATCH(makePatchReq({ assignmentId: 'a-1', quantity: 5 }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ assignmentId: 'a-1', quantity: 5 });
  });

  it('retorna 500 si falla', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB'));
    expect((await PATCH(makePatchReq({}))).status).toBe(500);
  });
});

describe('DELETE /api/admin/bookings/[id]/inventory', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockRemove.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await DELETE(makeDeleteReq('a-1'))).status).toBe(401);
  });

  it('elimina assignació', async () => {
    const res = await DELETE(makeDeleteReq('a-1'));
    expect(res.status).toBe(200);
    expect(mockRemove).toHaveBeenCalledWith('a-1');
  });

  it('passa null sense assignmentId', async () => {
    await DELETE(makeDeleteReq());
    expect(mockRemove).toHaveBeenCalledWith(null);
  });

  it('retorna 500 si falla', async () => {
    mockRemove.mockRejectedValueOnce(new Error('DB'));
    expect((await DELETE(makeDeleteReq('a-1'))).status).toBe(500);
  });
});
