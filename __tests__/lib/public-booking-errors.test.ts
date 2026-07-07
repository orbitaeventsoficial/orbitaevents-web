import { describe, expect, it } from 'vitest';
import { isPublicBookingErrorCode, PUBLIC_BOOKING_ERROR_CODES } from '@/lib/public-booking-errors';

describe('public booking error codes', () => {
  it('reconeix codis públics de reserva estables', () => {
    expect(PUBLIC_BOOKING_ERROR_CODES).toContain('DATE_UNAVAILABLE');
    expect(isPublicBookingErrorCode('DATE_UNAVAILABLE')).toBe(true);
  });

  it('rebutja valors no previstos', () => {
    expect(isPublicBookingErrorCode('date_unavailable')).toBe(false);
    expect(isPublicBookingErrorCode(null)).toBe(false);
  });
});
