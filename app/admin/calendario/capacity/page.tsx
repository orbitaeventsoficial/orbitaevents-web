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
  LIGHT: { label: 'Lleuger', color: 'admin-tone-text-cyan', bg: 'admin-tone-bg-cyan', dot: 'bg-[var(--o-info)]' },
  FULL: { label: 'Ple', color: 'admin-tone-text-warning', bg: 'admin-tone-bg-warning', dot: 'bg-[var(--o-warning)]' },
  OVERLOADED: { label: 'Sobrecarregat', color: 'admin-tone-text-danger', bg: 'admin-tone-bg-danger', dot: 'bg-[var(--o-danger)]' },
};

const ALERT_CONFIG: Record<WeekAlertLevel, { label: string; border: string; bg: string; tone: string }> = {
  NONE: { label: 'Sense reserves', border: 'border-white/10', bg: 'bg-white/[0.03]', tone: 'text-white/50' },
  INFO: { label: 'Activitat normal', border: 'admin-tone-border-cyan', bg: 'admin-tone-bg-cyan', tone: 'admin-tone-text-cyan' },
  WARNING: { label: 'Setmana intensa', border: 'admin-tone-border-warning', bg: 'admin-tone-bg-warning', tone: 'admin-tone-text-warning' },
  CRITICAL: { label: 'Capacitat al límit', border: 'admin-tone-border-danger', bg: 'admin-tone-bg-danger', tone: 'admin-tone-text-danger' },
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
        <div className="ap-card p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Total reserves</p>
          <p className="text-xl font-bold">{capacity.totalBookings}</p>
        </div>
        <div className="ap-card p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Dies lliures</p>
          <p className="text-xl font-bold admin-tone-text-success">{capacity.freeCount}</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${capacity.overloadedCount > 0 ? 'admin-tone-border-danger admin-tone-bg-danger' : 'border-[var(--line)] bg-[var(--panel)]'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Sobrecarregats</p>
          <p className={`text-xl font-bold ${capacity.overloadedCount > 0 ? 'admin-tone-text-danger' : ''}`}>{capacity.overloadedCount}</p>
        </div>
        <div className="ap-card p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Dia més ocupat</p>
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
                <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
              </div>

              {day.bookings.length > 0 ? (
                <div className="space-y-1 mt-1.5">
                  {day.bookings.map((b) => (
                    <Link
                      key={b.id}
                      href={buildBookingHref(b.id)}
                      className="block ap-card px-2 py-1 text-xs adm-row-hover transition-colors"
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
                <p className="text-xs opacity-30 mt-1">Sense reserves</p>
              )}

              {day.totalGuests > 0 && (
                <p className="text-xs opacity-40 mt-1">{day.totalGuests} convidats total</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs opacity-50">
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
                  <span className={`text-xs font-semibold ${config.tone}`}>{config.label}</span>
                </div>
                <p className="text-2xl font-bold">{week.bookingsCount}</p>
                <p className="text-xs opacity-50 mb-2">
                  {week.bookingsCount === 1 ? 'reserva' : 'reserves'} · {week.totalGuests} convidats
                </p>
                {week.overloadedDays > 0 && (
                  <p className="text-xs admin-tone-text-danger mb-1">
                    {week.overloadedDays} {week.overloadedDays === 1 ? 'dia sobrecarregat' : 'dies sobrecarregats'}
                  </p>
                )}
                {week.previousYearBookings > 0 ? (
                  <p className="text-xs opacity-60">
                    Any anterior: {week.previousYearBookings}
                    {week.yoyDelta != null && (
                      <span className={`ml-1 ${week.yoyDelta >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                        ({week.yoyDelta >= 0 ? '+' : ''}{Math.round(week.yoyDelta * 100)}%)
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs opacity-40">Sense referència any anterior</p>
                )}
                {week.alertMessage && (
                  <p className={`text-xs mt-2 ${config.tone}`}>{week.alertMessage}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AdminPage>
  );
}

