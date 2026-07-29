import type { AnomalyReport, AnomalyAlert } from '@/lib/services/dailyAnomalyService';

const LEVEL_STYLE = {
  POSITIVE: { border: 'admin-tone-border-success', bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', badge: 'admin-tone-bg-success admin-tone-text-success' },
  NEGATIVE: { border: 'admin-tone-border-danger', bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', badge: 'admin-tone-bg-danger admin-tone-text-danger' },
  NEUTRAL: { border: 'border-[var(--line)]', bg: 'bg-[var(--o-admin-fill-1)]', text: 'text-[var(--t2)]', badge: 'bg-[var(--raised)] text-[var(--t2)]' },
};

function DeviationBar({ deviation }: { deviation: number }) {
  const pct = Math.min(Math.abs(deviation) * 100, 200);
  const width = Math.max(pct / 2, 2);
  const color = deviation > 0 ? 'bg-[var(--o-success)]' : 'bg-[var(--o-danger)]';
  return (
    <div className="h-1.5 w-20 rounded-full bg-[var(--o-admin-fill-3)] overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function AnomalyRow({ alert }: { alert: AnomalyAlert }) {
  const style = LEVEL_STYLE[alert.level];
  const pct = Math.abs(Math.round(alert.deviation * 100));
  const sign = alert.deviation > 0 ? '+' : '-';

  return (
    <div className={`admin-stagger-item flex items-center gap-3 rounded-xl border px-4 py-3 ${style.border} ${style.bg} adm-row-hover transition-colors`}>
      <span className="text-lg shrink-0">{alert.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{alert.label}</p>
        <p className="text-xs opacity-60 truncate">{alert.message}</p>
      </div>
      <DeviationBar deviation={alert.deviation} />
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${style.badge}`}>
        {sign}{pct}%
      </span>
    </div>
  );
}

export default function AnomalyPanel({ report }: { report: AnomalyReport }) {
  if (report.anomalies.length === 0) return null;

  const hasNegative = report.anomalies.some((a) => a.level === 'NEGATIVE');
  const borderColor = hasNegative ? 'admin-tone-border-danger' : 'admin-tone-border-success';

  return (
    <section className={`rounded-[var(--o-r-md)] border p-5 bg-[var(--panel)] space-y-3 ${borderColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>📊</span>
            <span>Anomalies del dia</span>
          </h2>
          <p className="mt-1 text-xs opacity-60">{report.verdict}</p>
        </div>
        <span className="shrink-0 rounded-md bg-[var(--o-admin-fill-3)] px-2 py-0.5 text-xs font-bold opacity-50">
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
