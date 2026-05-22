import { AdminPage } from '@/app/admin/components/AdminPage';
import Link from 'next/link';
import { loadWeekCapacity, type DayLoadLevel } from '@/lib/services/bookingCapacityService';
import { loadWeeklyCapacityForecast, type WeekAlertLevel } from '@/lib/services/operationalForecastService';
import { getEventLabel } from '@/lib/constants';
import { ADMIN_WEEKDAY_SHORT_LABELS } from '@/lib/constants/admin';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Capacitat operativa | Òrbita Admin',
};

const LOAD_CONFIG: Record<DayLoadLevel, { label: string; color: string; bg: string; dot: string }> = {
  FREE: { label: 'Lliure', color: 'text-white/50', bg: 'bg-white/[0.02]', dot: 'bg-white/40' },
  LIGHT: { label: 'Lleuger', color: 'text-cyan-300', bg: 'bg-cyan-500/[0.06]', dot: 'bg-cyan-400' },
  FULL: { label: 'Ple', color: 'text-amber-300', bg: 'bg-amber-500/[0.06]', dot: 'bg-amber-400' },
  OVERLOADED: { label: 'Sobrecarregat', color: 'text-rose-300', bg: 'bg-rose-500/[0.06]', dot: 'bg-rose-400' },
};

const ALERT_CONFIG: Record<WeekAlertLevel, { label: string; border: string; bg: string; tone: string }> = {
  NONE: { label: 'Sense reserves', border: 'border-white/10', bg: 'bg-white/[0.03]', tone: 'text-white/50' },
  INFO: { label: 'Activitat normal', border: 'border-cyan-500/20', bg: 'bg-cyan-500/[0.06]', tone: 'text-cyan-300' },
  WARNING: { label: 'Setmana intensa', border: 'border-amber-500/30', bg: 'bg-amber-500/[0.08]', tone: 'text-amber-300' },
  CRITICAL: { label: 'Capacitat al límit', border: 'border-rose-500/40', bg: 'bg-rose-500/[0.08]', tone: 'text-rose-300' },
};

export default async function CapacityPage() {
  const now = new Date();
  const [capacity, weeklyForecast] = await Promise.all([
    loadWeekCapacity(now, 14),
    loadWeeklyCapacityForecast(now, 4),
  ]);

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
                      href={buildBookingHref(b.id)}
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

      {/* Forecast 4 setmanes */}
      <section className="mt-8">
        <h2 className="text-base font-semibold mb-1">Forecast 4 setmanes — alertes anticipades</h2>
        <p className="text-xs opacity-60 mb-3">
          Comparativa amb la mateixa setmana de l'any anterior. <span className="font-semibold">CRITICAL</span> indica
          dies sobrecarregats; <span className="font-semibold">WARNING</span>, setmana intensa.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {weeklyForecast.map((week) => {
            const config = ALERT_CONFIG[week.alertLevel];
            return (
              <div
                key={week.weekStart}
                className={`rounded-xl border p-3 ${config.border} ${config.bg}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold opacity-80">{week.weekStart} → {week.weekEnd.slice(8)}</span>
                  <span className={`text-[10px] font-semibold ${config.tone}`}>{config.label}</span>
                </div>
                <p className="text-2xl font-bold">{week.bookingsCount}</p>
                <p className="text-[10px] opacity-50 mb-2">
                  {week.bookingsCount === 1 ? 'reserva' : 'reserves'} · {week.totalGuests} convidats
                </p>
                {week.overloadedDays > 0 && (
                  <p className="text-[10px] text-rose-300 mb-1">
                    {week.overloadedDays} {week.overloadedDays === 1 ? 'dia sobrecarregat' : 'dies sobrecarregats'}
                  </p>
                )}
                {week.previousYearBookings > 0 ? (
                  <p className="text-[10px] opacity-60">
                    Any anterior: {week.previousYearBookings}
                    {week.yoyDelta != null && (
                      <span className={`ml-1 ${week.yoyDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        ({week.yoyDelta >= 0 ? '+' : ''}{Math.round(week.yoyDelta * 100)}%)
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-[10px] opacity-40">Sense referència any anterior</p>
                )}
                {week.alertMessage && (
                  <p className={`text-[10px] mt-2 ${config.tone}`}>{week.alertMessage}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AdminPage>
  );
}

