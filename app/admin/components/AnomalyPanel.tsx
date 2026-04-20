import type { AnomalyReport, AnomalyAlert } from '@/lib/services/dailyAnomalyService';

const LEVEL_STYLE = {
  POSITIVE: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.06]', text: 'text-emerald-200', badge: 'bg-emerald-500/20 text-emerald-300' },
  NEGATIVE: { border: 'border-rose-500/30', bg: 'bg-rose-500/[0.06]', text: 'text-rose-200', badge: 'bg-rose-500/20 text-rose-300' },
  NEUTRAL: { border: 'border-white/10', bg: 'bg-white/[0.02]', text: 'text-white/60', badge: 'bg-white/10 text-white/60' },
};

function DeviationBar({ deviation }: { deviation: number }) {
  const pct = Math.min(Math.abs(deviation) * 100, 200);
  const width = Math.max(pct / 2, 2);
  const color = deviation > 0 ? 'bg-emerald-400/60' : 'bg-rose-400/60';
  return (
    <div className="h-1.5 w-20 rounded-full bg-white/[0.06] overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function AnomalyRow({ alert }: { alert: AnomalyAlert }) {
  const style = LEVEL_STYLE[alert.level];
  const pct = Math.abs(Math.round(alert.deviation * 100));
  const sign = alert.deviation > 0 ? '+' : '-';

  return (
    <div className={`admin-stagger-item flex items-center gap-3 rounded-xl border px-4 py-3 ${style.border} ${style.bg} hover:bg-white/[0.03] transition-colors`}>
      <span className="text-lg shrink-0">{alert.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{alert.label}</p>
        <p className="text-[11px] opacity-60 truncate">{alert.message}</p>
      </div>
      <DeviationBar deviation={alert.deviation} />
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${style.badge}`}>
        {sign}{pct}%
      </span>
    </div>
  );
}

export default function AnomalyPanel({ report }: { report: AnomalyReport }) {
  if (report.anomalies.length === 0) return null;

  const hasNegative = report.anomalies.some((a) => a.level === 'NEGATIVE');
  const borderColor = hasNegative ? 'border-rose-500/20' : 'border-emerald-500/20';

  return (
    <section className={`rounded-2xl border p-5 admin-card-glass space-y-3 ${borderColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>📊</span>
            <span>Anomalies del dia</span>
          </h2>
          <p className="mt-1 text-xs opacity-60">{report.verdict}</p>
        </div>
        <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold opacity-50">
          vs {report.windowDays}d
        </span>
      </div>
      <div className="space-y-2">
        {report.anomalies.map((alert) => (
          <AnomalyRow key={alert.metric} alert={alert} />
        ))}
      </div>
    </section>
  );
}
