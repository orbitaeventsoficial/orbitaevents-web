import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRequirePermission, mockGetBookingDetail, mockUpdateBooking, mockDeleteBooking, mockDispatchAutoTrigger } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockGetBookingDetail: vi.fn(),
  mockUpdateBooking: vi.fn(),
  mockDeleteBooking: vi.fn(),
  mockDispatchAutoTrigger: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/services/bookingRouteService', () => ({
  getBookingDetail: mockGetBookingDetail,
  updateBookingDetail: mockUpdateBooking,
  deleteBookingIfAllowed: mockDeleteBooking,
}));
vi.mock('@/lib/services/automationTriggers', () => ({
  dispatchAutoTrigger: mockDispatchAutoTrigger,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/request-context', () => ({
  getRequestId: () => 'test-req-id',
}));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, PATCH, DELETE } from '@/app/api/admin/bookings/[id]/route';

function makeGetRequest(id = 'book-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}`),
    params: { params: { id } },
  };
}

function makePatchRequest(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

function makeDeleteRequest(id = 'book-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}`, { method: 'DELETE' }),
    params: { params: { id } },
  };
}

const sampleBooking = {
  id: 'book-1',
  reference: 'ORB-2026-001',
  status: 'CONFIRMED',
  customerId: 'cust-1',
  eventDate: '2026-06-20',
  eventLocation: 'Barcelona',
  guestCount: 100,
  total: 1200,
  depositAmount: 400,
  depositPaid: true,
  remainingPaid: false,
};

describe('GET /api/admin/bookings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockGetBookingDetail.mockResolvedValue({ status: 200, body: { booking: sampleBooking } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeGetRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(401);
    expect(mockGetBookingDetail).not.toHaveBeenCalled();
  });

  it('rebutja sense permís de lectura', async () => {
    mockRequirePermission.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    );
    const { req, params } = makeGetRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(403);
    expect(mockGetBookingDetail).not.toHaveBeenCalled();
  });

  it('retorna booking complet', async () => {
    const { req, params } = makeGetRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.booking.id).toBe('book-1');
    expect(body.booking.reference).toBe('ORB-2026-001');
    expect(body.booking.status).toBe('CONFIRMED');
    expect(body.booking.total).toBe(1200);
  });

  it('passa id correcte al servei', async () => {
    const { req, params } = makeGetRequest('book-xyz');
    await GET(req, params);
    expect(mockGetBookingDetail).toHaveBeenCalledWith('book-xyz');
  });

  it('retorna 404 si booking no existeix', async () => {
    mockGetBookingDetail.mockResolvedValueOnce({ status: 404, body: { error: 'Reserva no trobada' } });
    const { req, params } = makeGetRequest('inexistent');
    const res = await GET(req, params);
    expect(res.status).toBe(404);
  });

  it('retorna 500 si el servei falla', async () => {
    mockGetBookingDetail.mockRejectedValueOnce(new Error('DB error'));
    const { req, params } = makeGetRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/admin/bookings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockUpdateBooking.mockResolvedValue({
      status: 200,
      body: { booking: { ...sampleBooking, status: 'PREPARING' } },
      customerId: 'cust-1',
    });
    mockDispatchAutoTrigger.mockResolvedValue(undefined);
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePatchRequest('book-1', { status: 'PREPARING' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(401);
  });

  it('rebutja sense permís de mutació', async () => {
    mockRequirePermission.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    );
    const { req, params } = makePatchRequest('book-1', { status: 'PREPARING' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(403);
  });

  it('actualitza status correctament', async () => {
    const { req, params } = makePatchRequest('book-1', { status: 'PREPARING' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockUpdateBooking).toHaveBeenCalledWith('book-1', { status: 'PREPARING' });
  });

  it('dispara auto-trigger quan status és CONFIRMED', async () => {
    mockUpdateBooking.mockResolvedValueOnce({
      status: 200,
      body: { booking: { ...sampleBooking, status: 'CONFIRMED' } },
      customerId: 'cust-1',
    });
    const { req, params } = makePatchRequest('book-1', { status: 'CONFIRMED' });
    await PATCH(req, params);
    expect(mockDispatchAutoTrigger).toHaveBeenCalledWith({
      type: 'booking.confirmed',
      bookingId: 'book-1',
    });
  });

  it('no dispara auto-trigger per altres status', async () => {
    const { req, params } = makePatchRequest('book-1', { status: 'PREPARING' });
    await PATCH(req, params);
    expect(mockDispatchAutoTrigger).not.toHaveBeenCalled();
  });

  it('rebutja dades invàlides', async () => {
    const { req, params } = makePatchRequest('book-1', { status: 'INVALID' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja camps desconeguts (strict)', async () => {
    const { req, params } = makePatchRequest('book-1', { unknownField: 'xyz' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja línies de col·laborador sense cost real', async () => {
    const { req, params } = makePatchRequest('book-1', {
      serviceLines: [
        {
          collaboratorId: 'partner-1',
          kind: 'PROVIDER_SERVICE',
          label: 'Animació partner',
          revenueAmount: 240,
        },
      ],
    });

    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
    expect(mockUpdateBooking).not.toHaveBeenCalled();
    const body = await res.json();
    expect(JSON.stringify(body.details)).toContain('cost real');
  });
});

describe('DELETE /api/admin/bookings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockGetBookingDetail.mockResolvedValue({
      status: 200,
      body: { booking: { id: 'book-1', reference: 'ORB-2026-001', status: 'PENDING', customerId: 'cust-1' } },
    });
    mockDeleteBooking.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeDeleteRequest();
    const res = await DELETE(req, params);
    expect(res.status).toBe(401);
  });

  it('rebutja sense permís de mutació', async () => {
    mockRequirePermission.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    );
    const { req, params } = makeDeleteRequest();
    const res = await DELETE(req, params);
    expect(res.status).toBe(403);
  });

  it('elimina booking correctament', async () => {
    const { req, params } = makeDeleteRequest('book-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    expect(mockDeleteBooking).toHaveBeenCalled();
  });

  it('retorna 404 si booking no existeix', async () => {
    mockGetBookingDetail.mockResolvedValueOnce({ status: 404, body: { error: 'No trobada' } });
    const { req, params } = makeDeleteRequest('inexistent');
    const res = await DELETE(req, params);
    expect(res.status).toBe(404);
  });
});
