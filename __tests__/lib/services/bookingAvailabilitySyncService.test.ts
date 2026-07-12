import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    availability: {
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    booking: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  normalizeBookingAvailabilityDate,
  refreshBookingAvailabilityDate,
  syncBookingAvailabilityForState,
} from '@/lib/services/bookingAvailabilitySyncService';

describe('bookingAvailabilitySyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.availability.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.availability.upsert.mockResolvedValue({});
    mockPrisma.booking.findFirst.mockResolvedValue(null);
  });

  it('normalitza la disponibilitat al dia del bolo', () => {
    expect(normalizeBookingAvailabilityDate('2026-08-18T20:30:00.000Z')?.toISOString()).toBe('2026-08-18T00:00:00.000Z');
  });

  it('mou la disponibilitat quan una reserva activa canvia de data', async () => {
    await syncBookingAvailabilityForState({
      bookingId: 'booking-1',
      reference: 'OE-2026-001',
      clientName: 'Joan Garcia',
      previousEventDate: '2026-08-18T20:00:00.000Z',
      nextEventDate: '2026-08-20T20:00:00.000Z',
      nextStatus: 'CONFIRMED',
    });

    expect(mockPrisma.availability.updateMany).toHaveBeenCalledWith({
      where: {
        date: new Date('2026-08-18T00:00:00.000Z'),
        bookingId: 'booking-1',
      },
      data: { status: 'AVAILABLE', bookingId: null, note: null },
    });
    expect(mockPrisma.availability.upsert).toHaveBeenCalledWith({
      where: { date: new Date('2026-08-20T00:00:00.000Z') },
      create: expect.objectContaining({
        date: new Date('2026-08-20T00:00:00.000Z'),
        status: 'BOOKED',
        bookingId: 'booking-1',
        note: 'Reserva OE-2026-001 · Joan Garcia',
      }),
      update: expect.objectContaining({
        status: 'BOOKED',
        bookingId: 'booking-1',
        note: 'Reserva OE-2026-001 · Joan Garcia',
      }),
    });
  });

  it('manté el dia reservat si hi queda una altra reserva activa', async () => {
    mockPrisma.booking.findFirst.mockResolvedValue({
      id: 'booking-2',
      reference: 'OE-2026-002',
      clientName: 'Maria Soler',
    });

    await refreshBookingAvailabilityDate('2026-08-18', 'booking-1');

    expect(mockPrisma.availability.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.availability.upsert).toHaveBeenCalledWith({
      where: { date: new Date('2026-08-18T00:00:00.000Z') },
      create: expect.objectContaining({
        status: 'BOOKED',
        bookingId: 'booking-2',
        note: 'Reserva OE-2026-002 · Maria Soler',
      }),
      update: expect.objectContaining({
        status: 'BOOKED',
        bookingId: 'booking-2',
        note: 'Reserva OE-2026-002 · Maria Soler',
      }),
    });
  });

  it('allibera el dia quan la reserva deixa de bloquejar disponibilitat', async () => {
    await syncBookingAvailabilityForState({
      bookingId: 'booking-1',
      previousEventDate: '2026-08-18',
      nextEventDate: '2026-08-18',
      nextStatus: 'CANCELLED',
    });

    expect(mockPrisma.availability.updateMany).toHaveBeenCalledWith({
      where: {
        date: new Date('2026-08-18T00:00:00.000Z'),
        bookingId: 'booking-1',
      },
      data: { status: 'AVAILABLE', bookingId: null, note: null },
    });
    expect(mockPrisma.availability.upsert).not.toHaveBeenCalled();
  });
});
