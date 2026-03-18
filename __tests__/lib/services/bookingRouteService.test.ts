import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockApplySideEffects, mockSyncCalendar, mockCalcGmapsDistance, mockGetFuelRef } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    availability: { updateMany: vi.fn() },
    bookingExtra: { deleteMany: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockApplySideEffects: vi.fn(),
  mockSyncCalendar: vi.fn(),
  mockCalcGmapsDistance: vi.fn(),
  mockGetFuelRef: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/bookingStatusTransitionService', () => ({
  applyBookingStatusSideEffects: mockApplySideEffects,
}));
vi.mock('@/lib/services/googleCalendarSyncService', () => ({
  syncBookingToGoogleCalendar: mockSyncCalendar,
}));
vi.mock('@/lib/services/googleMapsDistance', () => ({
  calculateGoogleMapsDistance: mockCalcGmapsDistance,
}));
vi.mock('@/lib/services/fuelReferenceService', () => ({
  getFuelCostPerKmReference: mockGetFuelRef,
}));
vi.mock('@/lib/services/travelCost', () => ({
  calculateTravelCharge: (km: number) => km > 50 ? (km - 50) * 0.5 : 0,
  calculateTravelCost: (km: number, costPerKm: number) => km * costPerKm,
  DEFAULT_VEHICLE_COST_PER_KM: 0.15,
  sanitizeNonNegative: (v: number | null, fallback: number) => (v != null && v >= 0 ? v : fallback),
  INCLUDED_TRAVEL_KM: 100,
}));

import {
  getBookingDetail,
  updateBookingDetail,
  changeBookingStatus,
  deleteBookingIfAllowed,
} from '@/lib/services/bookingRouteService';

const MOCK_BOOKING = {
  id: 'booking-1',
  reference: 'OE-2026-ABCD',
  status: 'PENDING',
  customerId: 'cust-1',
  clientName: 'Maria',
  clientEmail: 'maria@test.com',
  eventType: 'BIRTHDAY',
  eventDate: new Date('2026-09-15'),
  eventLocation: 'Barcelona',
  eventVenue: null,
  eventStartTime: '21:00',
  eventEndTime: '04:00',
  guestCount: 80,
  subtotal: 400,
  discount: 0,
  vatRate: 21,
  distanceKm: null,
  fuelCostPerKm: null,
  preferredLocale: 'ca',
  pack: { translations: [] },
  extras: [],
  inventory: [],
  lead: null,
  postEventReport: null,
  clientSurvey: null,
  clientFeedback: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findUnique.mockResolvedValue(MOCK_BOOKING);
  mockPrisma.booking.update.mockResolvedValue(MOCK_BOOKING);
  mockPrisma.booking.delete.mockResolvedValue({});
  mockPrisma.availability.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.bookingExtra.deleteMany.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockApplySideEffects.mockResolvedValue({ statsUpdated: false });
  mockSyncCalendar.mockResolvedValue({ synced: true });
  mockGetFuelRef.mockResolvedValue({ costPerKm: 0.15 });
  mockCalcGmapsDistance.mockResolvedValue({ roundTripKm: 60 });
});

// ─────────────────────────────────────────────────────────────────────────
// getBookingDetail
// ─────────────────────────────────────────────────────────────────────────
describe('getBookingDetail', () => {
  it('retorna 200 amb reserva', async () => {
    const result = await getBookingDetail('booking-1');
    expect(result.status).toBe(200);
    expect(result.body.booking).toBeDefined();
  });

  it('retorna 404 si no trobada', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    const result = await getBookingDetail('inexistent');
    expect(result.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// updateBookingDetail
// ─────────────────────────────────────────────────────────────────────────
describe('updateBookingDetail', () => {
  it('actualitza reserva i retorna 200', async () => {
    const result = await updateBookingDetail('booking-1', { notes: 'Nota nova' });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(mockPrisma.booking.update).toHaveBeenCalled();
  });

  it('retorna 404 si reserva no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const result = await updateBookingDetail('inexistent', {});
    expect(result.status).toBe(404);
  });

  it('crea adminLog', async () => {
    await updateBookingDetail('booking-1', { notes: 'Test' });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'UPDATE',
          entity: 'booking',
          entityId: 'booking-1',
        }),
      })
    );
  });

  it('sincronitza calendari si canvia status', async () => {
    await updateBookingDetail('booking-1', { status: 'CONFIRMED' });

    expect(mockSyncCalendar).toHaveBeenCalledWith('booking-1');
  });

  it('no sincronitza calendari si no canvia camps sensibles', async () => {
    await updateBookingDetail('booking-1', { clientName: 'Nou nom' });

    expect(mockSyncCalendar).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// changeBookingStatus
// ─────────────────────────────────────────────────────────────────────────
describe('changeBookingStatus', () => {
  it('canvia status i retorna 200', async () => {
    const result = await changeBookingStatus('booking-1', 'CONFIRMED');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.previousStatus).toBe('PENDING');
    expect(result.body.newStatus).toBe('CONFIRMED');
  });

  it('retorna 404 si no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const result = await changeBookingStatus('inexistent', 'CONFIRMED');
    expect(result.status).toBe(404);
  });

  it('aplica side effects', async () => {
    await changeBookingStatus('booking-1', 'COMPLETED');

    expect(mockApplySideEffects).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: 'booking-1',
        oldStatus: 'PENDING',
        newStatus: 'COMPLETED',
      })
    );
  });

  it('sincronitza Google Calendar', async () => {
    await changeBookingStatus('booking-1', 'CONFIRMED');

    expect(mockSyncCalendar).toHaveBeenCalledWith('booking-1');
  });

  it('crea adminLog amb detalls del canvi', async () => {
    await changeBookingStatus('booking-1', 'CONFIRMED');

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({
            statusChange: 'PENDING → CONFIRMED',
          }),
        }),
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// deleteBookingIfAllowed
// ─────────────────────────────────────────────────────────────────────────
describe('deleteBookingIfAllowed', () => {
  it('elimina reserva PENDING', async () => {
    const result = await deleteBookingIfAllowed({
      id: 'booking-1',
      status: 'PENDING' as const,
      reference: 'OE-2026-ABCD',
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(mockPrisma.booking.delete).toHaveBeenCalled();
  });

  it('elimina reserva CANCELLED', async () => {
    const result = await deleteBookingIfAllowed({
      id: 'booking-1',
      status: 'CANCELLED' as const,
      reference: 'OE-2026-ABCD',
    });

    expect(result.ok).toBe(true);
  });

  it('retorna 400 si status CONFIRMED', async () => {
    const result = await deleteBookingIfAllowed({
      id: 'booking-1',
      status: 'CONFIRMED' as const,
      reference: 'OE-2026-ABCD',
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(mockPrisma.booking.delete).not.toHaveBeenCalled();
  });

  it('retorna 400 si status COMPLETED', async () => {
    const result = await deleteBookingIfAllowed({
      id: 'booking-1',
      status: 'COMPLETED' as const,
      reference: 'OE-2026-ABCD',
    });

    expect(result.ok).toBe(false);
  });

  it('allibera disponibilitat en eliminar', async () => {
    await deleteBookingIfAllowed({
      id: 'booking-1',
      status: 'PENDING' as const,
      reference: 'OE-2026-ABCD',
    });

    expect(mockPrisma.availability.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingId: 'booking-1' },
        data: expect.objectContaining({ status: 'AVAILABLE' }),
      })
    );
  });

  it('elimina bookingExtras associades', async () => {
    await deleteBookingIfAllowed({
      id: 'booking-1',
      status: 'PENDING' as const,
      reference: 'OE-2026-ABCD',
    });

    expect(mockPrisma.bookingExtra.deleteMany).toHaveBeenCalledWith({
      where: { bookingId: 'booking-1' },
    });
  });

  it('crea adminLog', async () => {
    await deleteBookingIfAllowed({
      id: 'booking-1',
      status: 'PENDING' as const,
      reference: 'OE-2026-ABCD',
    });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'DELETE',
          entity: 'booking',
        }),
      })
    );
  });
});
