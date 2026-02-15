import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';

export default function BookingsPanel({ data }: { data: CustomerHubDTO }) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Reserva / Dates</h2>
          <p className="text-sm text-slate-400">Planificació d’events del client.</p>
        </div>
        <Link
          href={`/admin/bookings/new?customerId=${data.customer.id}`}
          className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
        >
          Nova reserva
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {data.bookings.length === 0 ? (
          <p className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-sm text-slate-400">
            Sense reserves. Crea la primera reserva del client.
          </p>
        ) : (
          data.bookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{booking.reference || booking.id.slice(0, 8)}</p>
                <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] text-slate-300">
                  {booking.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {booking.date
                  ? new Date(booking.date).toLocaleDateString('ca-ES')
                  : 'Sense data'}{' '}
                · {booking.location || 'Sense ubicació'}
              </p>
              <Link
                href={`/admin/bookings/${booking.id}`}
                className="mt-2 inline-block text-xs text-cyan-300 hover:text-cyan-200"
              >
                Obrir reserva
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

