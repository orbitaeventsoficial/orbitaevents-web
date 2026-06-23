import Link from 'next/link';
import type { WeeklyCapacityForecast, WeekAlertLevel } from '@/lib/services/operationalForecastService';

const ALERT_STYLE: Record<WeekAlertLevel, { border: string; bg: string; tone: string; icon: string; label: string }> = {
  NONE: { border: 'border-white/10', bg: 'bg-[var(--o-admin-fill-1)]', tone: 'text-white/50', icon: '·', label: 'Sense reserves' },
  INFO: { border: 'admin-tone-border-info', bg: 'admin-tone-bg-info', tone: 'admin-tone-text-info', icon: '·', label: 'Normal' },
  WARNING: { border: 'admin-tone-border-warning', bg: 'admin-tone-bg-warning', tone: 'admin-tone-text-warning', icon: '!', label: 'Intensa' },
  CRITICAL: { border: 'admin-tone-border-danger', bg: 'admin-tone-bg-danger', tone: 'admin-tone-text-danger', icon: '!!', label: 'Al límit' },
};

export default function WeeklyCapacityForecastPanel({ forecast }: { forecast: WeeklyCapacityForecast[] }) {
  const flagged = forecast.filter((w) => w.alertLevel === 'WARNING' || w.alertLevel === 'CRITICAL');
  if (flagged.length === 0) return null;

  const hasCritical = flagged.some((w) => w.alertLevel === 'CRITICAL');
  const headerBorder = hasCritical ? 'admin-tone-border-danger' : 'admin-tone-border-warning';

  return (
    <section className={`admin-cr-panel admin-cr-forecast-panel ${headerBorder}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>Forecast capacitat (4 setmanes)</span>
          </h2>
          <p className="mt-1 text-xs opacity-60">
            {flagged.length} {flagged.length === 1 ? 'setmana' : 'setmanes'} amb alerta operativa anticipada.
          </p>
        </div>
        <Link
          href="/admin/calendario/capacity"
          className="admin-cr-action-link"
        >
          Capacitat →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {forecast.map((week) => {
          const style = ALERT_STYLE[week.alertLevel];
          return (
            <div
              key={week.weekStart}
              className={`admin-stagger-item rounded-xl border p-3 ${style.border} ${style.bg}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold opacity-80">
                  {week.weekStart.slice(5)} → {week.weekEnd.slice(5)}
                </span>
                <span className={`text-xs font-bold ${style.tone}`}>{style.label}</span>
              </div>
              <p className="text-xl font-bold">{week.bookingsCount}</p>
              <p className="text-xs opacity-50">
                {week.bookingsCount === 1 ? 'reserva' : 'reserves'}
                {week.overloadedDays > 0 && (
                  <span className="ml-1 admin-tone-text-danger">· {week.overloadedDays}d sobrec.</span>
                )}
              </p>
              {week.previousYearBookings > 0 && week.yoyDelta != null && (
                <p className="text-xs opacity-60 mt-1">
                  <span className={week.yoyDelta >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}>
                    {week.yoyDelta >= 0 ? '+' : ''}{Math.round(week.yoyDelta * 100)}%
                  </span>
                  <span className="ml-1 opacity-50">vs. any anterior</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
