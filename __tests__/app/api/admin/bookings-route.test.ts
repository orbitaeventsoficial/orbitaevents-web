import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRequirePermission, mockCreateBookingFromInput, mockListAdminBookings } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockCreateBookingFromInput: vi.fn(),
  mockListAdminBookings: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: () => 'test-req-id' }));
vi.mock('@/lib/services/bookingCreationService', () => ({ createBookingFromInput: mockCreateBookingFromInput }));
vi.mock('@/lib/services/bookingListService', () => ({ listAdminBookings: mockListAdminBookings }));

import { POST } from '@/app/api/admin/bookings/route';

function validBody() {
  return {
    clientName: ' Laia Test ',
    clientEmail: ' laia@example.com ',
    clientPhone: ' 600000000 ',
    eventType: 'OTHER',
    eventDate: ' 2026-06-20 ',
    eventLocation: ' Vic ',
    eventVenue: ' Sala ',
    guestCount: 100,
    packId: ' pack-1 ',
    notes: ' Nota interna ',
    tollsEur: 12.5,
  };
}

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockCreateBookingFromInput.mockResolvedValue({ status: 201, body: { booking: { id: 'booking-1' } } });
  });

  it('trimmeja el payload abans de crear la reserva', async () => {
    const res = await POST(makePostReq(validBody()));

    expect(res.status).toBe(201);
    expect(mockCreateBookingFromInput).toHaveBeenCalledWith(expect.objectContaining({
      clientName: 'Laia Test',
      clientEmail: 'laia@example.com',
      clientPhone: '600000000',
      eventDate: '2026-06-20',
      eventLocation: 'Vic',
      eventVenue: 'Sala',
      packId: 'pack-1',
      notes: 'Nota interna',
      tollsEur: 12.5,
    }));
  });

  it('rebutja camps obligatoris formats nomes per espais', async () => {
    const res = await POST(makePostReq({ ...validBody(), clientName: '   ', eventLocation: '   ' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Dades invàlides');
    expect(mockCreateBookingFromInput).not.toHaveBeenCalled();
  });
});
