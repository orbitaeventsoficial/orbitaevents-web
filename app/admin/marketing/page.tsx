import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import {
  loadMarketingHubSummary,
  type MarketingHubIntegrationStatus,
  type MarketingHubMeasurementGap,
} from '@/lib/services/marketingHubService';
import { formatCurrency } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marketing | Òrbita Admin',
};

const integrationTone: Record<MarketingHubIntegrationStatus, string> = {
  ready: 'ap-badge ap-badge--success',
  pending: 'ap-badge ap-badge--warning',
  blocked: 'ap-badge ap-badge--danger',
};

const integrationLabel: Record<MarketingHubIntegrationStatus, string> = {
  ready: 'Preparada',
  pending: 'Pendent',
  blocked: 'Bloquejada',
};

const diagnosticTone = {
  success: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
  warning: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  info: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
} as const;

const measurementGapTone: Record<MarketingHubMeasurementGap['status'], string> = {
  ready: 'admin-tone-border-success admin-tone-bg-success',
  missing: 'admin-tone-border-warning admin-tone-bg-warning',
  blocked: 'admin-tone-border-danger admin-tone-bg-danger',
};

const measurementGapLabel: Record<MarketingHubMeasurementGap['status'], string> = {
  ready: 'Cobert',
  missing: 'Falta dada',
  blocked: 'Bloquejat',
};

function trendLabel(trend: string, pct: number) {
  if (trend === 'UP') return `Puja ${pct}%`;
  if (trend === 'DOWN') return `Baixa ${Math.abs(pct)}%`;
  return 'Estable';
}

export default async function MarketingPage() {
  const summary = await loadMarketingHubSummary();
  const capture = summary.capture;

  return (
    <AdminPage
      title="Marketing Hub"
      subtitle="Captació, canals i integracions en una sola lectura operativa."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="ap-badge">Readiness · {summary.readiness}</span>
          <Link href="/admin/analytics" className="ap-btn ap-btn--secondary text-xs">
            Analítica
          </Link>
        </div>
      }
    >
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: summary.headline,
          tone: summary.readiness === 'PAID_BLOCKED' || summary.readiness === 'FOUNDATION' ? 'warning' : 'info',
          items: summary.systemItems,
          emptyText: 'Sense dades de captació encara.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'Decisions que no pot prendre el sistema',
          tone: summary.readiness === 'READY_TO_MEASURE' ? 'success' : 'warning',
          items: summary.manualItems,
          emptyText: 'No hi ha decisions manuals pendents.',
        }}
        nextStep={{
          eyebrow: 'Següent moviment',
          title: summary.nextStep.title,
          detail: summary.nextStep.detail,
          href: summary.nextStep.href,
          ctaLabel: summary.nextStep.label,
          secondaryAction: { href: '/admin/manual', label: 'Veure playbook' },
        }}
      />

      <section className="ap-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] admin-tone-text-neutral">Captació</p>
            <h2 className="mt-1 text-2xl font-semibold">{capture.headline}</h2>
            <p className="mt-2 max-w-3xl text-sm admin-tone-text-neutral">{summary.detail}</p>
          </div>
          <Link href={capture.suggestedAction.href} className="ap-btn ap-btn--primary text-xs">
            {capture.suggestedAction.label}
          </Link>
        </div>
        <div className="mt-5 ap-kpi-row lg:grid-cols-4">
          <div className="ap-kpi">
            <p className="ap-kpi-label">Leads 7 dies</p>
            <p className="ap-kpi-value">{capture.leadsLast7d}</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">{trendLabel(capture.trend7d, capture.trendPct7d)}</p>
          </div>
          <div className="ap-kpi ap-kpi--info">
            <p className="ap-kpi-label">Leads 30 dies</p>
            <p className="ap-kpi-value">{capture.leadsLast30d}</p>
            <p className="mt-1 text-xs admin-tone-text-neutral">{trendLabel(capture.trend30d, capture.trendPct30d)}</p>
          </div>
          <div className="ap-kpi ap-kpi--success">
            <p className="ap-kpi-label">Leads 90 dies</p>
            <p className="ap-kpi-value">{capture.leadsLast90d}</p>
          </div>
          <div className="ap-kpi ap-kpi--warning">
            <p className="ap-kpi-label">Font principal</p>
            <p className="ap-kpi-value text-2xl">{capture.sources[0]?.label || 'Sense dades'}</p>
          </div>
        </div>
      </section>

      <section className="ap-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] admin-tone-text-neutral">Diagnòstic per canal</p>
            <h2 className="mt-1 text-xl font-semibold">Què reforçar amb les dades actuals</h2>
          </div>
          <Link href="/admin/reporting" className="ap-btn ap-btn--secondary text-xs">
            Veure conversió
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summary.channelDiagnostics.map((diagnostic) => (
            <div key={diagnostic.source} className={`rounded-xl border p-4 ${diagnosticTone[diagnostic.tone]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{diagnostic.label}</h3>
                  <p className="mt-1 text-xs opacity-75">{diagnostic.verdict}</p>
                </div>
                <span className="shrink-0 text-xs font-bold">{diagnostic.count} · {diagnostic.share}%</span>
              </div>
              <p className="mt-3 text-xs font-semibold opacity-80">
                {diagnostic.wonCount} guanyats · {diagnostic.conversionRate}% conversió
              </p>
              <p className="mt-1 text-xs font-semibold opacity-80">
                {formatCurrency(diagnostic.revenue)} atribuïts
              </p>
              <p className="mt-3 text-sm leading-relaxed opacity-85">{diagnostic.action}</p>
              <Link href={diagnostic.href} className="mt-3 inline-flex text-xs font-bold underline underline-offset-4">
                Obrir canal
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="ap-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] admin-tone-text-neutral">ROI / CAC</p>
            <h2 className="mt-1 text-xl font-semibold">Forats de mesura abans d’invertir</h2>
          </div>
          <Link href="/admin/settings/integrations" className="ap-btn ap-btn--secondary text-xs">
            Integracions
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {summary.measurementGaps.map((gap) => (
            <div key={gap.id} className={`rounded-xl border p-4 ${measurementGapTone[gap.status]}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{gap.label}</h3>
                <span className="shrink-0 text-xs font-bold">{measurementGapLabel[gap.status]}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed admin-tone-text-neutral">{gap.evidence}</p>
              <p className="mt-3 text-sm leading-relaxed">{gap.action}</p>
              <Link href={gap.href} className="mt-3 inline-flex text-xs font-bold underline underline-offset-4">
                Resoldre
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="ap-card rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] admin-tone-text-neutral">Canal actiu</p>
          <h2 className="mt-2 text-xl font-semibold">{summary.activeChannel.title}</h2>
          <p className="mt-2 text-sm admin-tone-text-neutral">{summary.activeChannel.rule}</p>
          <div className="mt-4 space-y-2">
            {summary.activeChannel.allowedMoves.map((move) => (
              <div key={move} className="ap-card px-3 py-2 text-sm">
                {move}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border admin-tone-border-success admin-tone-bg-success p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] admin-tone-text-success">Sortida</p>
            <ul className="mt-2 space-y-1 text-sm admin-tone-text-success opacity-90">
              {summary.activeChannel.exitSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ap-card rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] admin-tone-text-neutral">Integracions</p>
          <h2 className="mt-2 text-xl font-semibold">Estat de mesura per canal</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.integrationStates.map((integration) => (
              <div key={integration.id} className="ap-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{integration.label}</h3>
                  <span className={integrationTone[integration.status]}>{integrationLabel[integration.status]}</span>
                </div>
                <p className="mt-2 text-sm admin-tone-text-neutral">{integration.detail}</p>
                {integration.missing && integration.missing.length > 0 && (
                  <p className="mt-2 text-xs admin-tone-text-warning">{integration.missing.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ap-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] admin-tone-text-neutral">CRM</p>
            <h2 className="mt-1 text-xl font-semibold">Fonts reals dels últims 90 dies</h2>
          </div>
          <Link href="/admin/reporting" className="ap-btn ap-btn--secondary text-xs">
            Reporting
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {capture.sources.length === 0 && (
            <p className="ap-card p-4 text-sm admin-tone-text-neutral">
              Encara no hi ha fonts de captació registrades al CRM.
            </p>
          )}
          {capture.sources.map((source) => (
            <div key={source.source}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{source.label}</span>
                <span>{source.count} · {source.percentage}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full admin-tone-bg-neutral">
                <div className="h-full rounded-full admin-tone-bg-info" style={{ width: `${source.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminPage>
  );
}
