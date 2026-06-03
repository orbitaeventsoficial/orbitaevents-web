import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockFindPortalAccess } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    adminLog: {
      create: vi.fn(),
    },
  },
  mockFindPortalAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/clientPortalAccess', () => ({
  findPortalAccessByRawToken: mockFindPortalAccess,
}));

import { declareBizumPayment, confirmBizumPayment } from '@/lib/services/bookingBizumService';

const BOOKING_ID = 'booking-123';
const TOKEN = 'test-token';

const baseBooking = {
  id: BOOKING_ID,
  depositPaid: false,
  remainingPaid: false,
  depositBizumDeclaredAt: null,
  remainingBizumDeclaredAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.update.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('declareBizumPayment', () => {
  it('retorna INVALID_TOKEN si el token no existeix', async () => {
    mockFindPortalAccess.mockResolvedValue(null);
    const result = await declareBizumPayment({ rawToken: TOKEN, paymentType: 'deposit' });
    expect(result).toEqual({ ok: false, reason: 'INVALID_TOKEN' });
  });

  it('retorna NOT_FOUND si la reserva no existeix', async () => {
    mockFindPortalAccess.mockResolvedValue({ id: 'access-1', bookingId: BOOKING_ID });
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    const result = await declareBizumPayment({ rawToken: TOKEN, paymentType: 'deposit' });
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('retorna ALREADY_PAID si el dipòsit ja estava pagat', async () => {
    mockFindPortalAccess.mockResolvedValue({ id: 'access-1', bookingId: BOOKING_ID });
    mockPrisma.booking.findUnique.mockResolvedValue({ ...baseBooking, depositPaid: true });
    const result = await declareBizumPayment({ rawToken: TOKEN, paymentType: 'deposit' });
    expect(result).toEqual({ ok: false, reason: 'ALREADY_PAID' });
  });

  it('retorna ALREADY_DECLARED si ja hi havia declaració pendent', async () => {
    mockFindPortalAccess.mockResolvedValue({ id: 'access-1', bookingId: BOOKING_ID });
    mockPrisma.booking.findUnique.mockResolvedValue({
      ...baseBooking,
      depositBizumDeclaredAt: new Date(),
    });
    const result = await declareBizumPayment({ rawToken: TOKEN, paymentType: 'deposit' });
    expect(result).toEqual({ ok: false, reason: 'ALREADY_DECLARED' });
  });

  it('marca depositBizumDeclaredAt i retorna ok:true', async () => {
    mockFindPortalAccess.mockResolvedValue({ id: 'access-1', bookingId: BOOKING_ID });
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);
    const result = await declareBizumPayment({ rawToken: TOKEN, paymentType: 'deposit' });
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: BOOKING_ID },
      data: expect.objectContaining({ depositBizumDeclaredAt: expect.any(Date) }),
    });
    expect(mockPrisma.adminLog.create).toHaveBeenCalled();
  });

  it('marca remainingBizumDeclaredAt per paymentType remaining', async () => {
    mockFindPortalAccess.mockResolvedValue({ id: 'access-1', bookingId: BOOKING_ID });
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);
    const result = await declareBizumPayment({ rawToken: TOKEN, paymentType: 'remaining' });
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: BOOKING_ID },
      data: expect.objectContaining({ remainingBizumDeclaredAt: expect.any(Date) }),
    });
  });
});

describe('confirmBizumPayment', () => {
  it('retorna NOT_FOUND si la reserva no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    const result = await confirmBizumPayment({ bookingId: BOOKING_ID, paymentType: 'deposit' });
    expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('retorna ALREADY_PAID si el dipòsit ja estava pagat', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...baseBooking, depositPaid: true });
    const result = await confirmBizumPayment({ bookingId: BOOKING_ID, paymentType: 'deposit' });
    expect(result).toEqual({ ok: false, reason: 'ALREADY_PAID' });
  });

  it('retorna NO_DECLARATION si no hi havia declaració prèvia', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);
    const result = await confirmBizumPayment({ bookingId: BOOKING_ID, paymentType: 'deposit' });
    expect(result).toEqual({ ok: false, reason: 'NO_DECLARATION' });
  });

  it('marca depositPaid i esborra depositBizumDeclaredAt', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      ...baseBooking,
      depositBizumDeclaredAt: new Date(),
    });
    const result = await confirmBizumPayment({ bookingId: BOOKING_ID, paymentType: 'deposit' });
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: BOOKING_ID },
      data: {
        depositPaid: true,
        depositPaidAt: expect.any(Date),
        depositBizumDeclaredAt: null,
      },
    });
  });

  it('marca remainingPaid i esborra remainingBizumDeclaredAt', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      ...baseBooking,
      remainingBizumDeclaredAt: new Date(),
    });
    const result = await confirmBizumPayment({ bookingId: BOOKING_ID, paymentType: 'remaining' });
    expect(result).toEqual({ ok: true });
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: BOOKING_ID },
      data: {
        remainingPaid: true,
        remainingPaidAt: expect.any(Date),
        remainingBizumDeclaredAt: null,
      },
    });
  });
});
