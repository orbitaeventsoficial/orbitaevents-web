import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockChangeStatus } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockChangeStatus: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/services/bookingRouteService', () => ({ changeBookingStatus: mockChangeStatus }));
vi.mock('@/lib/constants', () => ({
  BOOKING_STATUS_VALUES: ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'],
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { PATCH } from '@/app/api/admin/bookings/[id]/status/route';

function makePatchReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/status`, {
      method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('PATCH /api/admin/bookings/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockChangeStatus.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makePatchReq('book-1', { status: 'CONFIRMED' });
    expect((await PATCH(req, params)).status).toBe(401);
  });

  it('rebutja sense permís mutate', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const { req, params } = makePatchReq('book-1', { status: 'CONFIRMED' });
    expect((await PATCH(req, params)).status).toBe(403);
  });

  it('canvia estat correctament', async () => {
    const { req, params } = makePatchReq('book-1', { status: 'CONFIRMED' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockChangeStatus).toHaveBeenCalledWith('book-1', 'CONFIRMED');
  });

  it('rebutja estat invàlid', async () => {
    const { req, params } = makePatchReq('book-1', { status: 'INVALID' });
    expect((await PATCH(req, params)).status).toBe(400);
  });

  it('rebutja sense status', async () => {
    const { req, params } = makePatchReq('book-1', {});
    expect((await PATCH(req, params)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockChangeStatus.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePatchReq('book-1', { status: 'COMPLETED' });
    expect((await PATCH(req, params)).status).toBe(500);
  });
});
