import { AdminPage } from '@/app/admin/components/AdminPage';
import Link from 'next/link';
import { loadWeekCapacity, type DayLoadLevel } from '@/lib/services/bookingCapacityService';
import { getEventLabel } from '@/lib/constants';
import { ADMIN_WEEKDAY_SHORT_LABELS } from '@/lib/constants/admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Capacitat operativa | Òrbita Admin',
};

const LOAD_CONFIG: Record<DayLoadLevel, { label: string; color: string; bg: string; dot: string }> = {
  FREE: { label: 'Lliure', color: 'text-slate-400', bg: 'bg-white/[0.02]', dot: 'bg-slate-500' },
  LIGHT: { label: 'Lleuger', color: 'text-cyan-300', bg: 'bg-cyan-500/[0.06]', dot: 'bg-cyan-400' },
  FULL: { label: 'Ple', color: 'text-amber-300', bg: 'bg-amber-500/[0.06]', dot: 'bg-amber-400' },
  OVERLOADED: { label: 'Sobrecarregat', color: 'text-rose-300', bg: 'bg-rose-500/[0.06]', dot: 'bg-rose-400' },
};

export default async function CapacityPage() {
  const now = new Date();
  const capacity = await loadWeekCapacity(now, 14);

  return (
    <AdminPage
      title="Capacitat operativa"
      subtitle={`${capacity.totalBookings} reserves en 14 dies · ${capacity.freeCount} dies lliures`}
      back={{ href: '/admin/calendario', label: 'Calendari' }}
    >
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wider opacity-50">Total reserves</p>
          <p className="text-xl font-bold">{capacity.totalBookings}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wider opacity-50">Dies lliures</p>
          <p className="text-xl font-bold text-emerald-300">{capacity.freeCount}</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${capacity.overloadedCount > 0 ? 'border-rose-500/30 bg-rose-500/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
          <p className="text-[9px] font-semibold uppercase tracking-wider opacity-50">Sobrecarregats</p>
          <p className={`text-xl font-bold ${capacity.overloadedCount > 0 ? 'text-rose-300' : ''}`}>{capacity.overloadedCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wider opacity-50">Dia més ocupat</p>
          <p className="text-sm font-bold">{capacity.busiestDay ?? '—'}</p>
        </div>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {capacity.days.map((day) => {
          const config = LOAD_CONFIG[day.loadLevel];
          return (
            <div
              key={day.date}
              className={`rounded-xl border border-white/10 p-3 ${config.bg} ${day.isWeekend ? 'opacity-70' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${config.dot}`} />
                  <span className="text-xs font-semibold">{ADMIN_WEEKDAY_SHORT_LABELS[day.dayOfWeek]} {day.date.slice(8)}</span>
                </div>
                <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
              </div>

              {day.bookings.length > 0 ? (
                <div className="space-y-1 mt-1.5">
                  {day.bookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/bookings/${b.id}`}
                      className="block rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] hover:bg-white/[0.08] transition-colors"
                    >
                      <p className="font-medium truncate">{b.clientName}</p>
                      <div className="flex items-center gap-2 opacity-60">
                        <span>{getEventLabel(b.eventType)}</span>
                        <span>·</span>
                        <span>{b.guestCount}p</span>
                        {b.startTime && <span>· {b.startTime}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] opacity-30 mt-1">Sense reserves</p>
              )}

              {day.totalGuests > 0 && (
                <p className="text-[9px] opacity-40 mt-1">{day.totalGuests} convidats total</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-[10px] opacity-50">
        {Object.entries(LOAD_CONFIG).map(([key, c]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
            <span>{c.label}</span>
          </span>
        ))}
      </div>
    </AdminPage>
  );
}

