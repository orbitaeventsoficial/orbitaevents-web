export function buildBookingHref(bookingId: string, hash?: string | null): string {
  const base = `/admin/bookings/${bookingId}`;
  if (!hash) return base;
  return `${base}#${hash.replace(/^#/, '')}`;
}
