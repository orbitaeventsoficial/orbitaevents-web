import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockGetRequestId,
  mockUpdateBulkPaymentField,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetRequestId: vi.fn(),
  mockUpdateBulkPaymentField: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/bookingBulkPaymentService', () => ({
  updateBulkPaymentField: mockUpdateBulkPaymentField,
}));

import { POST } from '@/app/api/admin/bookings/bulk-payment/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/bookings/bulk-payment', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/bookings/bulk-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetRequestId.mockReturnValue('req-1');
    mockUpdateBulkPaymentField.mockResolvedValue({ count: 2 });
  });

  it('rebutja auth abans de permis i CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ bookingIds: ['b1'], field: 'depositPaid', value: true }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdateBulkPaymentField).not.toHaveBeenCalled();
  });

  it('rebutja sense permis mutate abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ bookingIds: ['b1'], field: 'depositPaid', value: true });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdateBulkPaymentField).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o mutar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ bookingIds: ['b1'], field: 'depositPaid', value: true });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdateBulkPaymentField).not.toHaveBeenCalled();
  });

  it('valida payload abans de mutar', async () => {
    const res = await POST(makePostReq({ bookingIds: [], field: 'depositPaid', value: true }));

    expect(res.status).toBe(400);
    expect(mockUpdateBulkPaymentField).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Error actualitzant pagaments' });
  });

  it('actualitza pagaments en bulk amb permis mutate', async () => {
    const req = makePostReq({ bookingIds: ['b1', 'b2'], field: 'remainingPaid', value: true });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockUpdateBulkPaymentField).toHaveBeenCalledWith(['b1', 'b2'], 'remainingPaid', true);
    await expect(res.json()).resolves.toEqual({ ok: true, updated: 2 });
  });
});
