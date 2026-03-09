import type { CustomerHubDTO, BookingDTO } from '@/lib/customer-hub/dto';
import { labelEstatReserva } from '@/lib/customer-hub/labels';
import Link from 'next/link';
import { EVENT_TYPE_LABELS, BOOKING_STATUS_CONFIG, formatDateFull, formatNumber } from '@/lib/constants';

// BOOKING_STATUS_COLORS is derived from the centralized BOOKING_STATUS_CONFIG but
// produces a single combined class string (border + bg + text) for badge styling.
// It has a different structure from BOOKING_STATUS_CONFIG, so it is kept local.
const BOOKING_STATUS_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(BOOKING_STATUS_CONFIG).map(([k, v]) => [k, `border-current ${v.bg} ${v.text}`])
);

function PaymentIndicator({ booking }: { booking: BookingDTO }) {
  const deposit = booking.depositAmount ?? 0;
  const total = booking.totalAmount ?? 0;
  const remaining = total - deposit;

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
      {deposit > 0 && (
        <span className={`rounded-full px-2 py-0.5 ${booking.depositPaid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
          Dipòsit {formatNumber(deposit)} € {booking.depositPaid ? '✓' : '✗'}
        </span>
      )}
      {remaining > 0 && (
        <span className={`rounded-full px-2 py-0.5 ${booking.remainingPaid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/40'}`}>
          Resta {formatNumber(remaining)} € {booking.remainingPaid ? '✓' : ''}
        </span>
      )}
    </div>
  );
}

export default function BookingsPanel({ data }: { data: CustomerHubDTO }) {
  const now = new Date();
  const upcoming = data.bookings.filter((b) => b.date && new Date(b.date) >= now && b.status !== 'CANCELLED');
  const past = data.bookings.filter((b) => !b.date || new Date(b.date) < now || b.status === 'CANCELLED');

  return (
    <section className="rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reserves / Dates</h2>
          <p className="text-sm">
            {data.bookings.length} total · {upcoming.length} properes · {past.length} passades
          </p>
        </div>
        <Link
          href={`/admin/bookings/new?customerId=${data.customer.id}`}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
        >
          Nova reserva
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {data.bookings.length === 0 ? (
          <p className="rounded-xl border p-3 text-sm">
            Sense reserves. Crea la primera reserva del client.
          </p>
        ) : (
          <>
          {upcoming.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Properes ({upcoming.length})</p>
          )}
          {upcoming.map((booking) => {
            const statusColor = BOOKING_STATUS_COLORS[booking.status] || 'border-white/10 bg-white/5 text-white/60';

            return (
              <div key={booking.id} className="rounded-xl border p-4">
                {/* Header: referència + badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{booking.reference || booking.id.slice(0, 8)}</p>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusColor}`}>
                    {labelEstatReserva(booking.status)}
                  </span>
                </div>

                {/* Event type + data + horari + countdown */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {booking.eventType && (
                    <span>{EVENT_TYPE_LABELS[booking.eventType] || booking.eventType}</span>
                  )}
                  <span>
                    {booking.date
                      ? formatDateFull(booking.date)
                      : 'Sense data'}
                  </span>
                  {booking.date && new Date(booking.date) >= now && booking.status !== 'CANCELLED' && (() => {
                    const days = Math.ceil((new Date(booking.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        days <= 7 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/50'
                      }`}>
                        {days === 0 ? 'AVUI' : `${days}d`}
                      </span>
                    );
                  })()}
                  {(booking.startTime || booking.endTime) && (
                    <span className="">
                      {booking.startTime || '?'} – {booking.endTime || '?'}
                    </span>
                  )}
                </div>

                {/* Ubicació */}
                {(booking.location || booking.venue) && (
                  <p className="mt-1 text-xs">
                    📍 {booking.venue || booking.location}
                  </p>
                )}

                {/* Pack + convidats */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {booking.packName && (
                    <span className="rounded-md px-2 py-0.5 text-[11px]">
                      🎵 {booking.packName}
                    </span>
                  )}
                  {booking.guestCount && (
                    <span className="rounded-md px-2 py-0.5 text-[11px]">
                      👥 {booking.guestCount} convidats
                    </span>
                  )}
                  {booking.discountCode && (
                    <span className="rounded-md px-2 py-0.5 text-[11px]">
                      🏷️ {booking.discountCode}
                    </span>
                  )}
                </div>

                {/* Pagaments */}
                {(booking.depositAmount || booking.totalAmount) && (
                  <PaymentIndicator booking={booking} />
                )}

                {/* Link a fitxa event */}
                <div className="mt-3 border-t pt-2">
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    Obrir fitxa d&apos;esdeveniment →
                  </Link>
                </div>
              </div>
            );
          })}
          {past.length > 0 && (
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Passades / Cancel·lades ({past.length})</p>
          )}
          {past.map((booking) => {
            const statusColor = BOOKING_STATUS_COLORS[booking.status] || 'border-white/10 bg-white/5 text-white/60';
            return (
              <div key={booking.id} className="rounded-xl border border-white/5 p-4 opacity-60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{booking.reference || booking.id.slice(0, 8)}</p>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusColor}`}>
                    {labelEstatReserva(booking.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs">{booking.date ? formatDateFull(booking.date) : 'Sense data'}</p>
                <div className="mt-2 border-t border-white/5 pt-2">
                  <Link href={`/admin/bookings/${booking.id}`} className="text-xs">
                    Obrir fitxa →
                  </Link>
                </div>
              </div>
            );
          })}
          </>
        )}
      </div>
    </section>
  );
}
