'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LossBreakdownEntry, LossSummary, MonthlyLossPoint } from '@/lib/services/leadLossAnalyticsService';
import { ADMIN_CHART_COLORS, ADMIN_CHART_SERIES_COLORS, ADMIN_SVG_COLORS } from '@/lib/constants/admin';
import { formatMonthYearCompact } from '@/lib/constants';

type LossBreakdownPanelProps = {
  initialSummary: LossSummary;
  days?: number;
};

type LossApiResponse = {
  ok: boolean;
  sinceDays: number;
  summary: LossSummary;
};

function buildDonutGradient(entries: LossBreakdownEntry[]): string {
  if (entries.length === 0) {
    return `conic-gradient(${ADMIN_SVG_COLORS.emptyGradient} 0deg 360deg)`;
  }

  const palette = ADMIN_CHART_COLORS;

  let current = 0;
  const stops = entries.map((entry, index) => {
    const size = (entry.share / 100) * 360;
    const start = current;
    const end = index === entries.length - 1 ? 360 : current + size;
    current = end;
    const color = palette[index % palette.length];
    return `${color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

function buildTrendPolyline(points: MonthlyLossPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return '8,64 152,64';

  const max = Math.max(...points.map((point) => point.count), 1);
  return points
    .map((point, index) => {
      const x = 8 + (index / (points.length - 1)) * 144;
      const y = 64 - ((point.count / max) * 48);
      return `${x},${y}`;
    })
    .join(' ');
}

function formatMonth(monthIso: string): string {
  return formatMonthYearCompact(monthIso);
}

export default function LossBreakdownPanel({
  initialSummary,
  days = 90,
}: LossBreakdownPanelProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState<'idle' | 'refreshing' | 'error'>('idle');

  useEffect(() => {
    let active = true;

    async function refresh() {
      setStatus('refreshing');

      try {
        const response = await fetch(`/api/admin/reports/lead-losses?days=${days}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as LossApiResponse;
        if (!active || !payload.ok) return;
        setSummary(payload.summary);
        setStatus('idle');
      } catch {
        if (!active) return;
        setStatus('error');
      }
    }

    void refresh();

    return () => {
      active = false;
    };
  }, [days]);

  const donutEntries = summary.byReason.slice(0, 5);
  const donutGradient = useMemo(() => buildDonutGradient(donutEntries), [donutEntries]);
  const trendPoints = useMemo(() => buildTrendPolyline(summary.byMonth), [summary.byMonth]);
  const topSources = summary.bySource.slice(0, 5);
  const topSourceMax = Math.max(...topSources.map((entry) => entry.count), 1);
  const narrative = summary.topReason
    ? `${summary.topReason.label} lidera la pèrdua comercial amb ${summary.topReason.count} leads (${summary.topReason.share}%).`
    : summary.autoTotal > 0
      ? 'La finestra actual només acumula auto-descartats per data passada; no hi ha un motiu comercial dominant.'
      : 'Sense prou pèrdues classificades per llegir un patró comercial dominant.';

  return (
    <section className="ap-card rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--t3)]">Pèrdues de lead</p>
          <h2 className="mt-2 ap-h2">Per què es refreda l&apos;embut</h2>
          <p className="mt-1 max-w-3xl text-sm admin-tone-text-neutral">
            Lectura dels últims {days} dies sobre el motiu de pèrdua, els canals afectats i la tendència mensual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
              status === 'error'
                ? 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger'
                : 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info'
            }`}
          >
            {status === 'refreshing' ? 'Actualitzant dades' : status === 'error' ? 'Mostrant snapshot inicial' : 'Dades sincronitzades'}
          </span>
          <a
            href={`/api/admin/reports/lead-losses?days=${days}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ap-btn ap-btn--secondary text-xs"
          >
            Exportar JSON
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="ap-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--t3)]">Motiu principal</p>
          <p className="mt-2 text-lg font-semibold text-[var(--t)]">{summary.topReason?.label ?? 'Sense patró comercial clar'}</p>
          <p className="mt-1 text-xs admin-tone-text-neutral">
            {summary.topReason ? `${summary.topReason.count} leads · ${summary.topReason.share}% del total` : 'Cap motiu comercial domina la mostra actual.'}
          </p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--t3)]">Leads perduts</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--t)]">{summary.total}</p>
          <p className="mt-1 text-xs admin-tone-text-neutral">{summary.commercialTotal} comercials · {summary.autoTotal} automàtics</p>
        </div>
        <div className="rounded-2xl border admin-tone-border-warning admin-tone-bg-warning p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] admin-tone-text-warning">Auto-descartats</p>
          <p className="mt-2 text-2xl font-semibold admin-tone-text-warning">{summary.autoTotal}</p>
          <p className="mt-1 text-xs admin-tone-text-warning">Leads amb `EVENT_PASSED` fora del càlcul del motiu comercial principal.</p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--t3)]">Sense classificar</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--t)]">{summary.uncategorized}</p>
          <p className="mt-1 text-xs admin-tone-text-neutral">Pèrdues sense motiu canònic o amb dades antigues encara no sanejades.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border admin-tone-border-info admin-tone-bg-info p-4">
        <p className="text-sm admin-tone-text-info">{narrative}</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <article className="ap-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--t)]">Mix de motius</h3>
              <p className="mt-1 text-xs admin-tone-text-neutral">Distribució de pèrdues classificades per motiu canònic.</p>
            </div>
          </div>

          {donutEntries.length > 0 ? (
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
              <div
                aria-label="Donut de motius de pèrdua"
                className="mx-auto h-40 w-40 rounded-full border border-[var(--line)]"
                style={{ backgroundImage: donutGradient }}
              >
                <div className="m-auto mt-7 flex h-24 w-24 items-center justify-center rounded-full border border-[var(--line)] admin-donut-hole text-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--t3)]">Leads</p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--t)]">{summary.total}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {donutEntries.map((entry, index) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--sunk)] px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length] }}
                      />
                      <span className="text-[var(--t2)]">{entry.label}</span>
                    </div>
                    <span className="text-[var(--t2)]">{entry.count} · {entry.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm admin-tone-text-neutral">Encara no hi ha pèrdues classificades dins la finestra seleccionada.</p>
          )}
        </article>

        <article className="ap-card p-4">
          <h3 className="text-sm font-semibold text-[var(--t)]">Canals més afectats</h3>
          <p className="mt-1 text-xs admin-tone-text-neutral">On es concentren més pèrdues dins la finestra actual.</p>

          {topSources.length > 0 ? (
            <div className="mt-4 space-y-3">
              {topSources.map((entry) => {
                const width = Math.max((entry.count / topSourceMax) * 100, 8);
                return (
                  <div key={entry.key}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[var(--t2)]">{entry.label}</span>
                      <span className="text-[var(--t2)]">{entry.count} · {entry.share}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--raised)]">
                      <div className="h-2 rounded-full admin-tone-bg-info" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm admin-tone-text-neutral">Sense fonts de pèrdua registrades encara.</p>
          )}
        </article>

        <article className="ap-card p-4">
          <h3 className="text-sm font-semibold text-[var(--t)]">Tendència mensual</h3>
          <p className="mt-1 text-xs admin-tone-text-neutral">Evolució dels leads perduts per mes natural.</p>

          {summary.byMonth.length > 0 ? (
            <>
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--sunk)] p-3">
                <svg viewBox="0 0 160 72" className="h-28 w-full" role="img" aria-label="Tendència mensual de pèrdues">
                  <path d="M8 64 H152" stroke={ADMIN_SVG_COLORS.baselineLine} strokeWidth="1" />
                  <polyline
                    fill="none"
                    stroke={ADMIN_CHART_SERIES_COLORS.trendLine}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={trendPoints}
                  />
                  {summary.byMonth.map((point, index) => {
                    const max = Math.max(...summary.byMonth.map((item) => item.count), 1);
                    const x = summary.byMonth.length === 1 ? 80 : 8 + (index / (summary.byMonth.length - 1)) * 144;
                    const y = 64 - ((point.count / max) * 48);
                    return <circle key={point.monthIso} cx={x} cy={y} r="3.5" fill={ADMIN_CHART_SERIES_COLORS.trendDots} />;
                  })}
                </svg>
              </div>
              <div className="mt-3 grid gap-2">
                {summary.byMonth.slice(-4).map((point) => (
                  <div key={point.monthIso} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--sunk)] px-3 py-2 text-xs">
                    <span className="text-[var(--t2)]">{formatMonth(point.monthIso)}</span>
                    <span className="text-[var(--t2)]">{point.count} leads</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm admin-tone-text-neutral">Encara no hi ha prou historial per dibuixar tendència.</p>
          )}
        </article>
      </div>
    </section>
  );
}

export { buildDonutGradient, buildTrendPolyline, formatMonth };
