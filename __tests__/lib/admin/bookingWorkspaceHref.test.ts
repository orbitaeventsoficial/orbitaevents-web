import { describe, expect, it } from 'vitest';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';

describe('buildBookingHref', () => {
  it('construeix la URL de detall d\'una reserva', () => {
    expect(buildBookingHref('booking-1')).toBe('/admin/bookings/booking-1');
    expect(buildBookingHref('abc123')).toBe('/admin/bookings/abc123');
  });
});
