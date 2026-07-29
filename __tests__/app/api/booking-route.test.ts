import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCheckRateLimit, mockCreatePublicBooking, mockIsDateUnavailableBookingError } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockCreatePublicBooking: vi.fn(),
  mockIsDateUnavailableBookingError: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock('@/lib/services/publicBookingService', () => ({
  createPublicBooking: mockCreatePublicBooking,
  isDateUnavailableBookingError: mockIsDateUnavailableBookingError,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));

import { POST } from '@/app/api/booking/route';

const VALID_BODY = {
  clientName: 'Maria Lopez',
  clientEmail: 'maria@example.com',
  clientPhone: '+34699111222',
  eventType: 'BIRTHDAY',
  eventDate: '2026-09-15',
  eventLocation: 'Barcelona',
  guestCount: 80,
  packId: 'pack-1',
};

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/booking', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/booking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(null);
    mockIsDateUnavailableBookingError.mockReturnValue(false);
    mockCreatePublicBooking.mockResolvedValue({
      status: 201,
      body: { success: true, data: { reference: 'OE-2026-ABCD' } },
    });
  });

  it('retorna errorCode si falten camps obligatoris', async () => {
    const res = await POST(makePostReq({ ...VALID_BODY, packId: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errorCode).toBe('MISSING_REQUIRED_FIELDS');
    expect(mockCreatePublicBooking).not.toHaveBeenCalled();
  });

  it('retorna errorCode si un camp obligatori només té espais', async () => {
    const res = await POST(makePostReq({ ...VALID_BODY, clientName: '   ' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errorCode).toBe('MISSING_REQUIRED_FIELDS');
    expect(mockCreatePublicBooking).not.toHaveBeenCalled();
  });

  it('retorna errorCode si el format email no valida', async () => {
    const res = await POST(makePostReq({ ...VALID_BODY, clientEmail: 'maria' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errorCode).toBe('INVALID_EMAIL');
    expect(mockCreatePublicBooking).not.toHaveBeenCalled();
  });

  it('propaga errorCode del servei de reserva pública', async () => {
    mockCreatePublicBooking.mockResolvedValueOnce({
      status: 400,
      body: { success: false, error: 'Invalid event date', errorCode: 'INVALID_EVENT_DATE' },
    });

    const res = await POST(makePostReq(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.errorCode).toBe('INVALID_EVENT_DATE');
  });

  it('retorna errorCode estable si la data queda ocupada en transacció', async () => {
    const bookingError = new Error('Date is not available');
    mockCreatePublicBooking.mockRejectedValueOnce(bookingError);
    mockIsDateUnavailableBookingError.mockReturnValueOnce(true);

    const res = await POST(makePostReq(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.errorCode).toBe('DATE_UNAVAILABLE');
    expect(mockIsDateUnavailableBookingError).toHaveBeenCalledWith(bookingError);
  });
});
