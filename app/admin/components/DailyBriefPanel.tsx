import Link from 'next/link';
import type { DailyBrief, AlertLevel } from '@/lib/services/dailyBriefService';
import { formatNumber } from '@/lib/constants';

const ALERT_TONE: Record<AlertLevel, string> = {
  CRITICAL: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
  WARNING: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  INFO: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
};

export default function DailyBriefPanel({ brief }: { brief: DailyBrief }) {
  return (
    <section className="admin-cr-daily-brief rounded-2xl border p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Resum del dia</h2>
          <p className="mt-0.5 text-xs opacity-60">{brief.summary}</p>
        </div>
        <Link
          href="/admin/reporting"
          className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs hover:bg-[var(--raised)]"
        >
          Reporting →
        </Link>
      </div>

      {/* KPIs inline */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <div className="ap-card p-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Entrades avui</p>
          <p className="text-lg font-bold">{brief.kpis.newLeadsToday}</p>
        </div>
        <div className="ap-card p-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Leads oberts</p>
          <p className="text-lg font-bold">{brief.kpis.openLeads}</p>
        </div>
        <div className={`rounded-lg border p-2 text-center ${brief.kpis.overdueTasksCount > 0 ? 'admin-tone-border-danger admin-tone-bg-danger' : 'border-[var(--line)] bg-[var(--panel)]'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Vençudes</p>
          <p className={`text-lg font-bold ${brief.kpis.overdueTasksCount > 0 ? 'admin-tone-text-danger' : ''}`}>{brief.kpis.overdueTasksCount}</p>
        </div>
        <div className="ap-card p-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Reserves 7d</p>
          <p className="text-lg font-bold">{brief.kpis.upcomingBookings7d}</p>
        </div>
        <div className={`rounded-lg border p-2 text-center ${brief.kpis.pendingPaymentsCount > 0 ? 'admin-tone-border-warning admin-tone-bg-warning' : 'border-[var(--line)] bg-[var(--panel)]'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Cobraments</p>
          <p className={`text-lg font-bold ${brief.kpis.pendingPaymentsCount > 0 ? 'admin-tone-text-warning' : ''}`}>{brief.kpis.pendingPaymentsCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--sunk)] p-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Previsió</p>
          <p className="text-lg font-bold text-[var(--gold)]">{formatNumber(Math.round(brief.kpis.forecastWeighted))}€</p>
        </div>
      </div>

      {/* Alerts */}
      {brief.alerts.length > 0 && (
        <div className="space-y-1.5">
          {brief.alerts.map((alert, i) => (
            <Link
              key={i}
              href={alert.href}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-[var(--raised)] ${ALERT_TONE[alert.level]}`}
            >
              <span className="admin-cr-alert-mark" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold">{alert.title}</span>
                <span className="ml-1.5 opacity-70">{alert.detail}</span>
              </div>
              <span className="text-xs opacity-50 shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      {brief.actions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1.5">Accions prioritàries</p>
          <div className="flex flex-wrap gap-1.5">
            {brief.actions.slice(0, 5).map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="ap-card px-3 py-1.5 text-xs adm-row-hover transition-colors"
              >
                <span className="font-medium">{action.label}</span>
                <span className="ml-1 opacity-50">({action.detail})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top campaigns */}
      {brief.topCampaigns.length > 0 && (
        <div className="flex items-center gap-2 text-xs opacity-50">
          <span>Campanyes suggerides:</span>
          {brief.topCampaigns.map((c, i) => (
            <span key={i}>{c.name} ({c.audienceSize})</span>
          ))}
          <Link href="/admin/campaigns" className="ml-auto hover:opacity-80">Veure totes →</Link>
        </div>
      )}
    </section>
  );
}
