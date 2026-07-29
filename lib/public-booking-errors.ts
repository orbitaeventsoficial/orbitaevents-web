import { PUBLIC_BOOKING_ERROR_CODES } from '@/lib/constants/publicBooking';

export { PUBLIC_BOOKING_ERROR_CODES };

export type PublicBookingErrorCode = (typeof PUBLIC_BOOKING_ERROR_CODES)[number];

const PUBLIC_BOOKING_ERROR_CODE_SET = new Set<string>(PUBLIC_BOOKING_ERROR_CODES);

export function isPublicBookingErrorCode(value: unknown): value is PublicBookingErrorCode {
  return typeof value === 'string' && PUBLIC_BOOKING_ERROR_CODE_SET.has(value);
}
