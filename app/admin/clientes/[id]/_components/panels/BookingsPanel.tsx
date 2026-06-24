import type { CustomerHubDTO, BookingDTO } from '@/lib/customer-hub/dto';
import { labelEstatReserva } from '@/lib/customer-hub/labels';
import Link from 'next/link';
import { BOOKING_STATUS_CONFIG, formatDateFull, formatNumber, getEventLabel } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { buildCustomerBookingCreateHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';

function getBookingStatusBadgeClass(status: string) {
  const tone = BOOKING_STATUS_CONFIG[status];
  return tone ? ('border-current ' + tone.bg + ' ' + tone.text) : 'ch__booking-status--muted';
}

function PaymentIndicator({ booking }: { booking: BookingDTO }) {
  const deposit = booking.depositAmount ?? 0;
  const total = booking.totalAmount ?? 0;
  const remaining = total - deposit;

  return (
    <div className="ch__booking-payment" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.payment)}>
      {deposit > 0 && (
        <span className={`ch__booking-pill ${booking.depositPaid ? 'ch__booking-pill--success' : 'ch__booking-pill--danger'}`}>
          Dipòsit {formatNumber(deposit)} € {booking.depositPaid ? '✓' : '✗'}
        </span>
      )}
      {remaining > 0 && (
        <span className={`ch__booking-pill ${booking.remainingPaid ? 'ch__booking-pill--success' : 'ch__booking-pill--muted'}`}>
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
  const customerBookingCreateHref = buildCustomerBookingCreateHref(data.customer.id);

  return (
    <section className="ch__bookings-panel" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.root)}>
      <div className="ch__bookings-head">
        <div>
          <h2 className="ch__bookings-title">Reserves / Dates</h2>
          <p className="ch__bookings-summary">{data.bookings.length} total · {upcoming.length} properes · {past.length} passades</p>
        </div>
        <Link href={customerBookingCreateHref} className="ap-btn ap-btn--primary ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.newBooking)}>
          Nova reserva
        </Link>
      </div>

      <div className="ch__bookings-list">
        {data.bookings.length === 0 ? (
          <p className="ch__bookings-empty">Sense reserves. Crea la primera reserva del client.</p>
        ) : (
          <>
            {upcoming.length > 0 && <p className="ch__bookings-section-label">Properes ({upcoming.length})</p>}
            {upcoming.map((booking) => {
              const statusColor = getBookingStatusBadgeClass(booking.status);
              const reference = booking.reference || booking.id.slice(0, 8);
              return (
                <div key={booking.id} className="ch__booking-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.card(reference))}>
                  <div className="ch__booking-card-head">
                    <p className="ch__booking-ref">{reference}</p>
                    <span className={`ch__booking-status ${statusColor}`}>{labelEstatReserva(booking.status)}</span>
                  </div>

                  <div className="ch__booking-meta">
                    {booking.eventType && <span>{getEventLabel(booking.eventType)}</span>}
                    <span>{booking.date ? formatDateFull(booking.date) : 'Sense data'}</span>
                    {booking.date && new Date(booking.date) >= now && booking.status !== 'CANCELLED' && (() => {
                      const days = Math.ceil((new Date(booking.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return <span className={`ch__booking-pill ${days <= 7 ? 'ch__booking-pill--warning' : 'ch__booking-pill--muted'}`}>{days === 0 ? 'AVUI' : `${days}d`}</span>;
                    })()}
                    {(booking.startTime || booking.endTime) && <span>{booking.startTime || '?'} – {booking.endTime || '?'}</span>}
                  </div>

                  {(booking.location || booking.venue) && <p className="ch__booking-location">📍 {booking.venue || booking.location}</p>}

                  <div className="ch__booking-tags">
                    {booking.packName && <span className="ch__booking-tag">🎵 {booking.packName}</span>}
                    {booking.guestCount && <span className="ch__booking-tag">👥 {booking.guestCount} convidats</span>}
                    {booking.discountCode && <span className="ch__booking-tag">🏷️ {booking.discountCode}</span>}
                  </div>

                  {(booking.depositAmount || booking.totalAmount) && <PaymentIndicator booking={booking} />}

                  <div className="ch__booking-actions">
                    <Link href={buildBookingHref(booking.id)} className="ch__booking-link" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.openBooking)}>
                      Obrir fitxa d&apos;esdeveniment →
                    </Link>
                  </div>
                </div>
              );
            })}
            {past.length > 0 && <p className="ch__bookings-section-label ch__bookings-section-label--muted">Passades / Cancel·lades ({past.length})</p>}
            {past.map((booking) => {
              const statusColor = getBookingStatusBadgeClass(booking.status);
              return (
                <div key={booking.id} className="ch__booking-card ch__booking-card--past">
                  <div className="ch__booking-card-head">
                    <p className="ch__booking-ref">{booking.reference || booking.id.slice(0, 8)}</p>
                    <span className={`ch__booking-status ${statusColor}`}>{labelEstatReserva(booking.status)}</span>
                  </div>
                  <p className="ch__booking-location">{booking.date ? formatDateFull(booking.date) : 'Sense data'}</p>
                  <div className="ch__booking-actions">
                    <Link href={buildBookingHref(booking.id)} className="ch__booking-link ch__booking-link--plain" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.openBooking)}>
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
