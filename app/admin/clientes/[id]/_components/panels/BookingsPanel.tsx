import type { CustomerHubDTO, BookingDTO } from '@/lib/customer-hub/dto';
import { labelEstatReserva } from '@/lib/customer-hub/labels';
import Link from 'next/link';
import { BOOKING_STATUS_CONFIG, formatDateFull, formatNumber, getEventLabel } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminSection } from '@/app/admin/components/AdminPage';
import { buildCustomerBookingCreateHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { bookingOutstandingBreakdown } from '@/lib/payment-status';

const PILL_BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-tight';
const STATUS_BASE = `${PILL_BASE} border`;

const PILL_TONE: Record<'success' | 'danger' | 'warning' | 'muted', string> = {
  success: 'bg-[var(--ax-success-bg)] text-[var(--o-success)]',
  danger: 'bg-[var(--ax-danger-bg)] text-[var(--o-danger)]',
  warning: 'bg-[var(--ax-warning-bg)] text-[var(--o-warning)]',
  muted: 'bg-[var(--ax-fill-3)] text-[var(--t3)]',
};

function getBookingStatusBadgeClass(status: string) {
  const tone = BOOKING_STATUS_CONFIG[status];
  return tone ? ('border-current ' + tone.bg + ' ' + tone.text) : 'border-[var(--line2)] bg-[var(--ax-fill-3)] text-[var(--t2)]';
}

function PaymentIndicator({ booking }: { booking: BookingDTO }) {
  const deposit = booking.depositAmount ?? 0;
  const total = booking.totalAmount ?? 0;
  const remaining = booking.remainingAmount ?? Math.max(0, total - deposit);
  const breakdown = bookingOutstandingBreakdown({
    total,
    depositAmount: deposit,
    remainingAmount: remaining,
    depositPaid: booking.depositPaid === true,
    remainingPaid: booking.remainingPaid === true,
    cashAmount: booking.cashAmount,
  });
  const depositSettled = breakdown.depositAmount <= 0;
  const remainingSettled = breakdown.remainingAmount <= 0;

  return (
    <div className="mt-2 flex flex-wrap gap-2" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.payment)}>
      {deposit > 0 && (
        <span className={`${PILL_BASE} ${depositSettled ? PILL_TONE.success : PILL_TONE.danger}`}>
          Dipòsit {formatNumber(deposit)} € {depositSettled ? '✓' : '✗'}
        </span>
      )}
      {remaining > 0 && (
        <span className={`${PILL_BASE} ${remainingSettled ? PILL_TONE.success : PILL_TONE.muted}`}>
          Resta {formatNumber(remaining)} € {remainingSettled ? '✓' : ''}
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
    <AdminSection
      title="Reserves / Dates"
      description={`${data.bookings.length} total · ${upcoming.length} properes · ${past.length} passades`}
      actions={
        <Link href={customerBookingCreateHref} className="ap-btn ap-btn--primary ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.newBooking)}>
          Nova reserva
        </Link>
      }
      help={ADMIN_CUSTOMER_PANEL_HELP.bookings.root}
    >
      <div className="flex flex-col gap-3">
        {data.bookings.length === 0 ? (
          <p className="m-0 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] p-3 text-sm text-[var(--t2)]">Sense reserves. Crea la primera reserva del client.</p>
        ) : (
          <>
            {upcoming.length > 0 && <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t2)]">Properes ({upcoming.length})</p>}
            {upcoming.map((booking) => {
              const statusColor = getBookingStatusBadgeClass(booking.status);
              const reference = booking.reference || booking.id.slice(0, 8);
              return (
                <div key={booking.id} className="rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.card(reference))}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="m-0 text-sm font-semibold text-[var(--t)]">{reference}</p>
                    <span className={`${STATUS_BASE} ${statusColor}`}>{labelEstatReserva(booking.status)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--t2)]">
                    {booking.eventType && <span>{getEventLabel(booking.eventType)}</span>}
                    <span>{booking.date ? formatDateFull(booking.date) : 'Sense data'}</span>
                    {booking.date && new Date(booking.date) >= now && booking.status !== 'CANCELLED' && (() => {
                      const days = Math.ceil((new Date(booking.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return <span className={`${PILL_BASE} ${days <= 7 ? PILL_TONE.warning : PILL_TONE.muted}`}>{days === 0 ? 'AVUI' : `${days}d`}</span>;
                    })()}
                    {(booking.startTime || booking.endTime) && <span>{booking.startTime || '?'} – {booking.endTime || '?'}</span>}
                  </div>

                  {(booking.location || booking.venue) && <p className="mt-1 text-xs leading-snug text-[var(--t2)]">📍 {booking.venue || booking.location}</p>}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {booking.packName && <span className="rounded-[var(--o-r-md)] bg-[var(--ax-fill-2)] px-2 py-0.5 text-xs leading-tight text-[var(--t2)]">🎵 {booking.packName}</span>}
                    {booking.guestCount && <span className="rounded-[var(--o-r-md)] bg-[var(--ax-fill-2)] px-2 py-0.5 text-xs leading-tight text-[var(--t2)]">👥 {booking.guestCount} convidats</span>}
                    {booking.discountCode && <span className="rounded-[var(--o-r-md)] bg-[var(--ax-fill-2)] px-2 py-0.5 text-xs leading-tight text-[var(--t2)]">🏷️ {booking.discountCode}</span>}
                  </div>

                  {(booking.depositAmount || booking.totalAmount) && <PaymentIndicator booking={booking} />}

                  <div className="mt-3 border-t border-[var(--line)] pt-2">
                    <Link href={buildBookingHref(booking.id)} className="ap-btn ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.openBooking)}>
                      Obrir fitxa d&apos;esdeveniment →
                    </Link>
                  </div>
                </div>
              );
            })}
            {past.length > 0 && <p className="m-0 mt-1 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t3)]">Passades / Cancel·lades ({past.length})</p>}
            {past.map((booking) => {
              const statusColor = getBookingStatusBadgeClass(booking.status);
              return (
                <div key={booking.id} className="rounded-[var(--o-r-xl)] border border-[var(--line)] bg-[var(--raised)] p-4 opacity-[0.62]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="m-0 text-sm font-semibold text-[var(--t)]">{booking.reference || booking.id.slice(0, 8)}</p>
                    <span className={`${STATUS_BASE} ${statusColor}`}>{labelEstatReserva(booking.status)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-[var(--t2)]">{booking.date ? formatDateFull(booking.date) : 'Sense data'}</p>
                  <div className="mt-3 border-t border-[var(--line)] pt-2">
                    <Link href={buildBookingHref(booking.id)} className="text-xs font-semibold text-[var(--t2)] transition-colors hover:text-[var(--t)]" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.bookings.openBooking)}>
                      Obrir fitxa →
                    </Link>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </AdminSection>
  );
}
