import Link from 'next/link';
import type { WeeklyCapacityForecast, WeekAlertLevel } from '@/lib/services/operationalForecastService';

const ALERT_STYLE: Record<WeekAlertLevel, { border: string; bg: string; tone: string; icon: string; label: string }> = {
  NONE: { border: 'border-white/10', bg: 'bg-white/[0.03]', tone: 'text-white/50', icon: '·', label: 'Sense reserves' },
  INFO: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/[0.06]', tone: 'text-cyan-300', icon: '·', label: 'Normal' },
  WARNING: { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.08]', tone: 'text-amber-300', icon: '!', label: 'Intensa' },
  CRITICAL: { border: 'border-rose-500/40', bg: 'bg-rose-500/[0.08]', tone: 'text-rose-300', icon: '!!', label: 'Al límit' },
};

export default function WeeklyCapacityForecastPanel({ forecast }: { forecast: WeeklyCapacityForecast[] }) {
  const flagged = forecast.filter((w) => w.alertLevel === 'WARNING' || w.alertLevel === 'CRITICAL');
  if (flagged.length === 0) return null;

  const hasCritical = flagged.some((w) => w.alertLevel === 'CRITICAL');
  const headerBorder = hasCritical ? 'border-rose-500/30' : 'border-amber-500/30';

  return (
    <section className={`rounded-2xl border ${headerBorder} p-5 admin-card-glass space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>📅</span>
            <span>Forecast capacitat (4 setmanes)</span>
          </h2>
          <p className="mt-1 text-xs opacity-60">
            {flagged.length} {flagged.length === 1 ? 'setmana' : 'setmanes'} amb alerta operativa anticipada.
          </p>
        </div>
        <Link
          href="/admin/calendario/capacity"
          className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold transition-colors hover:bg-white/10"
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
                <span className="text-[11px] font-semibold opacity-80">
                  {week.weekStart.slice(5)} → {week.weekEnd.slice(5)}
                </span>
                <span className={`text-[10px] font-bold ${style.tone}`}>{style.label}</span>
              </div>
              <p className="text-xl font-bold">{week.bookingsCount}</p>
              <p className="text-[10px] opacity-50">
                {week.bookingsCount === 1 ? 'reserva' : 'reserves'}
                {week.overloadedDays > 0 && (
                  <span className="ml-1 text-rose-300">· {week.overloadedDays}d sobrec.</span>
                )}
              </p>
              {week.previousYearBookings > 0 && week.yoyDelta != null && (
                <p className="text-[10px] opacity-60 mt-1">
                  <span className={week.yoyDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
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
