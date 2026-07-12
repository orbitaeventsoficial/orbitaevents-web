import { describe, expect, it } from 'vitest';
import {
  buildBookingInventoryConflictBookingWhere,
  getBookingEventDayRange,
} from '@/lib/services/bookingInventoryAvailability';

describe('bookingInventoryAvailability', () => {
  it('construeix el rang del dia del bolo', () => {
    const range = getBookingEventDayRange(new Date('2026-08-18T20:30:00.000Z'));

    expect(range?.gte.toISOString()).toBe('2026-08-18T00:00:00.000Z');
    expect(range?.lt.toISOString()).toBe('2026-08-19T00:00:00.000Z');
  });

  it('limita conflictes d inventari a altres reserves actives del mateix dia', () => {
    expect(buildBookingInventoryConflictBookingWhere({
      bookingId: 'booking-1',
      eventDate: '2026-08-18T20:30:00.000Z',
      statuses: ['PENDING', 'CONFIRMED', 'PREPARING'],
    })).toEqual({
      id: { not: 'booking-1' },
      status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
      eventDate: {
        gte: new Date('2026-08-18T00:00:00.000Z'),
        lt: new Date('2026-08-19T00:00:00.000Z'),
      },
    });
  });

  it('sense data valida conserva un filtre conservador per estat', () => {
    expect(buildBookingInventoryConflictBookingWhere({
      bookingId: 'booking-1',
      eventDate: null,
      statuses: ['CONFIRMED'],
    })).toEqual({
      id: { not: 'booking-1' },
      status: { in: ['CONFIRMED'] },
    });
  });
});
