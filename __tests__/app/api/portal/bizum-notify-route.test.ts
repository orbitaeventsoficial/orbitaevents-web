import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDeclareBizumPayment } = vi.hoisted(() => ({
  mockDeclareBizumPayment: vi.fn(),
}));

vi.mock('@/lib/services/bookingBizumService', () => ({
  declareBizumPayment: mockDeclareBizumPayment,
}));

import { POST } from '@/app/api/portal/[token]/bizum-notify/route';

function makeRequest(body: Record<string, unknown>, token = 'portal-token') {
  return {
    req: new NextRequest(`http://localhost/api/portal/${token}/bizum-notify`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { token } },
  };
}

describe('POST /api/portal/[token]/bizum-notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeclareBizumPayment.mockResolvedValue({ ok: true });
  });

  it('registra la declaracio Bizum del client per token i tram', async () => {
    const { req, params } = makeRequest({ paymentType: 'deposit' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(mockDeclareBizumPayment).toHaveBeenCalledWith({
      rawToken: 'portal-token',
      paymentType: 'deposit',
    });
  });

  it('rebutja trams desconeguts abans de tocar el servei', async () => {
    const { req, params } = makeRequest({ paymentType: 'cash' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'INVALID_INPUT' });
    expect(mockDeclareBizumPayment).not.toHaveBeenCalled();
  });

  it('retorna conflicte si el client ja havia declarat el Bizum', async () => {
    mockDeclareBizumPayment.mockResolvedValue({ ok: false, reason: 'ALREADY_DECLARED' });
    const { req, params } = makeRequest({ paymentType: 'remaining' });

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ error: 'ALREADY_DECLARED' });
  });
});
