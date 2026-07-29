import Link from 'next/link';
import type { CaptureHealthReport, CaptureHealthStatus, CaptureTrend } from '@/lib/services/captureHealthService';

// Consumeix les classes d'estat canòniques (admin-tone-*). GROWING era cyan (blau,
// fora del canon) → success (creixent = positiu); la resta = semàfor de sèrie.
const STATUS_STYLE: Record<CaptureHealthStatus, { border: string; bg: string; text: string }> = {
  DROUGHT: { border: 'admin-tone-border-danger', bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger' },
  FAMINE: { border: 'admin-tone-border-danger', bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger' },
  LOW: { border: 'admin-tone-border-warning', bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning' },
  HEALTHY: { border: 'admin-tone-border-success', bg: 'admin-tone-bg-success', text: 'admin-tone-text-success' },
  GROWING: { border: 'admin-tone-border-success', bg: 'admin-tone-bg-success', text: 'admin-tone-text-success' },
};

const TREND_ICON: Record<CaptureTrend, string> = {
  UP: '▲',
  DOWN: '▼',
  FLAT: '▬',
};

const TREND_COLOR: Record<CaptureTrend, string> = {
  UP: 'admin-tone-text-success',
  DOWN: 'admin-tone-text-danger',
  FLAT: 'text-[var(--t3)]',
};

function formatTrendPct(trend: CaptureTrend, pct: number): string {
  if (trend === 'FLAT') return 'estable';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

export default function CaptureHealthPanel({ report }: { report: CaptureHealthReport }) {
  const style = STATUS_STYLE[report.status];
  const isCritical = report.status === 'DROUGHT' || report.status === 'FAMINE';

  return (
    <section className={`ap-card grid gap-4 p-4 ${style.border} ${style.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>Estat de captació</span>
          </h2>
          <p className={`mt-1 text-base font-bold leading-tight ${style.text}`}>{report.headline}</p>
          <p className="mt-1 text-xs opacity-70">{report.detail}</p>
        </div>
        <Link
          href={report.suggestedAction.href}
          className={`ap-btn ap-btn--secondary ap-btn--xs ${isCritical ? 'admin-tone-border-danger' : ''}`}
        >
          {report.suggestedAction.label} →
        </Link>
      </div>

      {/* Tendència: 7d, 30d, 90d */}
      <div className="grid grid-cols-3 gap-2">
        <div className="ap-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Últims 7 dies</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold">{report.leadsLast7d}</p>
            <span className={`text-xs font-bold ${TREND_COLOR[report.trend7d]}`}>
              {TREND_ICON[report.trend7d]} {formatTrendPct(report.trend7d, report.trendPct7d)}
            </span>
          </div>
          <p className="mt-1 text-xs opacity-50">vs {report.leadsPrev7d} setmana anterior</p>
        </div>
        <div className="ap-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Últims 30 dies</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold">{report.leadsLast30d}</p>
            <span className={`text-xs font-bold ${TREND_COLOR[report.trend30d]}`}>
              {TREND_ICON[report.trend30d]} {formatTrendPct(report.trend30d, report.trendPct30d)}
            </span>
          </div>
          <p className="mt-1 text-xs opacity-50">vs {report.leadsPrev30d} mes anterior</p>
        </div>
        <div className="ap-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Últims 90 dies</p>
          <p className="mt-1 text-2xl font-bold">{report.leadsLast90d}</p>
          <p className="mt-1 text-xs opacity-50">trimestre complet</p>
        </div>
      </div>

      {/* Suggerit detail */}
      <p className="ap-card p-3 text-xs leading-relaxed opacity-80">
        <span className="font-semibold">Recomanació:</span> {report.suggestedAction.detail}
      </p>

      {/* Origen dels leads (si n'hi ha) */}
      {report.sources.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-60">Origen dels leads (90d)</p>
          <div className="space-y-1.5">
            {report.sources.slice(0, 5).map((source) => (
              <div key={source.source} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs font-semibold">{source.label}</span>
                <div className="relative flex-1 h-5 rounded-md border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--o-admin-gold-tint-3)]"
                    style={{ width: `${source.percentage}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between px-2 h-full text-xs font-semibold">
                    <span>{source.count} leads</span>
                    <span className="opacity-70">{source.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.sources.length === 0 && (
        <p className="ap-card p-3 text-center text-xs opacity-60">
          Cap lead als últims 90 dies per mostrar origen.
        </p>
      )}
    </section>
  );
}
