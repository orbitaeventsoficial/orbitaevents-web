import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRequirePermission, mockConfirmBizumPayment } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockConfirmBizumPayment: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/bookingBizumService', () => ({
  confirmBizumPayment: mockConfirmBizumPayment,
}));

import { POST } from '@/app/api/admin/bookings/[id]/confirm-bizum/route';

function makeRequest(body: Record<string, unknown>, id = 'booking-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/confirm-bizum`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('POST /api/admin/bookings/[id]/confirm-bizum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockConfirmBizumPayment.mockResolvedValue({ ok: true });
  });

  it('exigeix permis de mutacio abans de confirmar Bizum', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const { req, params } = makeRequest({ paymentType: 'deposit' });

    const res = await POST(req, params);

    expect(res.status).toBe(403);
    expect(mockConfirmBizumPayment).not.toHaveBeenCalled();
  });

  it('confirma la declaracio Bizum del tram indicat', async () => {
    const { req, params } = makeRequest({ paymentType: 'remaining' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mockConfirmBizumPayment).toHaveBeenCalledWith({
      bookingId: 'booking-1',
      paymentType: 'remaining',
    });
  });

  it('retorna 409 si no hi havia declaracio Bizum pendent', async () => {
    mockConfirmBizumPayment.mockResolvedValue({ ok: false, reason: 'NO_DECLARATION' });
    const { req, params } = makeRequest({ paymentType: 'deposit' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ error: 'NO_DECLARATION' });
  });
});
