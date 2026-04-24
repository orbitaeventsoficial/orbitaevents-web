import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { buildExecutiveReport } from '@/lib/services/executiveReportService';
import { formatNumber } from '@/lib/constants';
import { loadEmailTrackingReport } from '@/lib/services/emailTrackingService';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reporting Executiu | Òrbita Admin',
};

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function currency(value: number): string {
  return `${formatNumber(Math.round(value))}€`;
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-right text-[11px] font-medium opacity-70 shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded bg-white/5 overflow-hidden">
        <div
          className="h-full rounded bg-cyan-500/30"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-bold">{value}</span>
    </div>
  );
}

export default async function ReportingPage() {
  const [report, emailTracking] = await Promise.all([
    buildExecutiveReport(),
    loadEmailTrackingReport(90),
  ]);
  const marginRate = report.margin.marginRate;
  const recurrenceRate = report.recurrence.returningRate;
  const openRate = emailTracking.globalOpenRate / 100;
  const replyRate = emailTracking.globalReplyRate / 100;
  const systemItems = [
    `${currency(report.headline.forecastWeighted)} de previsió ponderada sobre ${currency(report.headline.pipelineRaw)} de pipeline`,
    `${currency(report.margin.grossMargin)} de marge brut amb taxa del ${pct(marginRate)}`,
    `${pct(recurrenceRate)} de recurrència i ${report.recurrence.avgEventsPerCustomer.toFixed(1)} events per client`,
    `${emailTracking.totalSent} emails trackejats en ${emailTracking.windowDays} dies amb open rate del ${emailTracking.globalOpenRate}%`,
  ].filter(Boolean);
  const manualItems = [
    report.headline.slaBroken > 0 ? `${report.headline.slaBroken} SLA trencats encara impacten el reporting executiu` : '',
    marginRate < 0.55 ? `El marge brut està en ${pct(marginRate)} i demana revisar pricing o cost directe` : '',
    recurrenceRate < 0.3 ? `La recurrència és del ${pct(recurrenceRate)} i encara no consolida base fidel` : '',
    replyRate < 0.08 || openRate < 0.35
      ? `El tracking d'email encara és fluix (${emailTracking.globalOpenRate}% opens, ${emailTracking.globalReplyRate}% replies)`
      : '',
  ].filter(Boolean);
  const nextStep =
    report.headline.slaBroken > 0
      ? {
          title: 'Tallar el soroll operatiu abans de llegir conclusions',
          detail: `Hi ha ${report.headline.slaBroken} SLA trencats. Si la base comercial està arribant tard, el reporting explica símptomes però no arregla la causa.`,
          href: '/admin/leads',
          ctaLabel: 'Obrir entrades',
          secondaryAction: { href: '/admin/sales-ops', label: 'Veure Sales Ops' },
        }
      : marginRate < 0.55
        ? {
            title: 'Revisar marge i pricing abans d’escalar',
            detail: `La taxa de marge brut és del ${pct(marginRate)}. El següent pas no és mirar més volum sinó protegir rendibilitat i estructura de preu.`,
            href: '/admin/pricing',
            ctaLabel: 'Revisar preus',
            secondaryAction: { href: '/admin/economia', label: 'Mirar finances' },
          }
        : recurrenceRate < 0.3
          ? {
              title: 'Treballar recurrència i recuperació, no només captació',
              detail: `Només ${pct(recurrenceRate)} dels clients són recurrents. El retorn ara és reforçar Customer Hub, post-event i referrals.`,
              href: '/admin/clientes',
              ctaLabel: 'Obrir clients',
              secondaryAction: { href: '/admin/clientes/referrals', label: 'Veure referrals' },
            }
          : {
              title: 'Optimitzar missatges i conversió dels canals forts',
              detail: `La base financera no mostra un incendi immediat. El millor següent pas és llegir millor què converteix i empènyer els canals amb millor qualitat.`,
              href: '/admin/sales-ops',
              ctaLabel: 'Anar a Sales Ops',
              secondaryAction: { href: '/admin/analytics', label: 'Obrir analítica' },
            };

  const funnelMax = Math.max(
    report.funnel.NEW,
    report.funnel.CONTACTED,
    report.funnel.QUOTE_SENT,
    report.funnel.NEGOTIATING,
    report.funnel.WON,
    report.funnel.LOST
  );

  return (
    <AdminPage
      title="Reporting Executiu"
      subtitle="Facturació, marge, conversió, recurrència i tendència"
      actions={
        <div className="flex gap-2">
          <Link href="/admin/sales-ops" className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
            Sales Ops →
          </Link>
          <a
            href="/api/admin/reports/executive"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            Exportar JSON
          </a>
        </div>
      }
    >
      <div className="space-y-6 p-6">
        <OwnerControlStrip
          system={{
            eyebrow: 'Automàtic',
            title: 'Què vigila el sistema',
            tone: report.headline.slaBroken > 0 ? 'warning' : 'info',
            items: systemItems,
            emptyText: 'Sense senyals executives automàtiques rellevants ara mateix.',
          }}
          manual={{
            eyebrow: 'Manual',
            title: 'On et cal intervenir',
            tone: manualItems.length > 0 ? 'warning' : 'success',
            items: manualItems,
            emptyText: 'Sense desviacions crítiques. Pots usar el reporting per optimització fina.',
          }}
          nextStep={{
            eyebrow: 'Següent pas',
            ...nextStep,
          }}
        />

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Clients</p>
            <p className="mt-1 text-xl font-bold">{report.headline.customers}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Leads oberts</p>
            <p className="mt-1 text-xl font-bold">{report.headline.openLeads}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Reserves tancades</p>
            <p className="mt-1 text-xl font-bold text-emerald-300">{report.headline.bookingsClosed}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Ingressos</p>
            <p className="mt-1 text-xl font-bold text-emerald-300">{currency(report.headline.revenueClosed)}</p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Pipeline brut</p>
            <p className="mt-1 text-xl font-bold text-cyan-300">{currency(report.headline.pipelineRaw)}</p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Previsió ponderada</p>
            <p className="mt-1 text-xl font-bold text-cyan-300">{currency(report.headline.forecastWeighted)}</p>
          </div>
          <div className={`rounded-xl border p-3 ${report.headline.slaBroken > 0 ? 'border-rose-500/30 bg-rose-500/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">SLA trencats</p>
            <p className={`mt-1 text-xl font-bold ${report.headline.slaBroken > 0 ? 'text-rose-300' : ''}`}>{report.headline.slaBroken}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Funnel */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold">Embut comercial</h2>
            <div className="mt-4 space-y-2">
              <FunnelBar label="Nous" value={report.funnel.NEW} max={funnelMax} />
              <FunnelBar label="Contactats" value={report.funnel.CONTACTED} max={funnelMax} />
              <FunnelBar label="Pressupost enviat" value={report.funnel.QUOTE_SENT} max={funnelMax} />
              <FunnelBar label="Negociant" value={report.funnel.NEGOTIATING} max={funnelMax} />
              <FunnelBar label="Tancats (WON)" value={report.funnel.WON} max={funnelMax} />
              <FunnelBar label="Perduts" value={report.funnel.LOST} max={funnelMax} />
            </div>
          </section>

          {/* Margin + Recurrence */}
          <div className="space-y-6">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-sm font-semibold">Marge brut</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] opacity-60">Ingressos totals</p>
                  <p className="text-lg font-bold">{currency(report.margin.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60">Cost directe (desplaçament)</p>
                  <p className="text-lg font-bold">{currency(report.margin.totalCost)}</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60">Marge brut</p>
                  <p className="text-lg font-bold text-emerald-300">{currency(report.margin.grossMargin)}</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60">Taxa de marge</p>
                  <p className="text-lg font-bold text-emerald-300">{pct(report.margin.marginRate)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-sm font-semibold">Recurrència</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] opacity-60">Clients recurrents</p>
                  <p className="text-lg font-bold">{report.recurrence.returning} / {report.recurrence.totalCustomers}</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60">Taxa recurrència</p>
                  <p className="text-lg font-bold">{pct(report.recurrence.returningRate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] opacity-60">Mitjana events per client</p>
                  <p className="text-lg font-bold">{report.recurrence.avgEventsPerCustomer.toFixed(1)}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Conversion by Source */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold">Conversió per origen (CAC)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm" aria-label="Conversió per origen">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] font-semibold uppercase tracking-wider opacity-60">
                  <th className="py-2 pr-4">Origen</th>
                  <th className="py-2 pr-4">Total leads</th>
                  <th className="py-2 pr-4">Tancats</th>
                  <th className="py-2 pr-4">Win rate</th>
                  <th className="py-2">Ingrés mig/client</th>
                </tr>
              </thead>
              <tbody>
                {report.conversionBySource.map((row) => (
                  <tr key={row.source} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-medium">{row.source}</td>
                    <td className="py-2 pr-4">{row.total}</td>
                    <td className="py-2 pr-4">{row.won}</td>
                    <td className="py-2 pr-4">{pct(row.winRate)}</td>
                    <td className="py-2">{row.avgRevenue > 0 ? currency(row.avgRevenue) : '—'}</td>
                  </tr>
                ))}
                {report.conversionBySource.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center opacity-50">Sense dades</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Tracking d&apos;email per plantilla</h2>
              <p className="mt-1 text-xs opacity-60">
                Obertures, clics i respostes reals dels últims {emailTracking.windowDays} dies.
              </p>
            </div>
            <a
              href="/api/admin/email-tracking?days=90"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              Exportar tracking JSON
            </a>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Emails enviats</p>
              <p className="mt-1 text-xl font-bold">{emailTracking.totalSent}</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Open rate global</p>
              <p className="mt-1 text-xl font-bold text-cyan-300">{emailTracking.globalOpenRate}%</p>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Click rate global</p>
              <p className="mt-1 text-xl font-bold text-violet-300">{emailTracking.globalClickRate}%</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Reply rate global</p>
              <p className="mt-1 text-xl font-bold text-emerald-300">{emailTracking.globalReplyRate}%</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Millor performer</p>
              <p className="mt-2 text-sm font-semibold">
                {emailTracking.bestPerformer || 'Sense prou mostra'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Pitjor performer</p>
              <p className="mt-2 text-sm font-semibold">
                {emailTracking.worstPerformer || 'Sense prou mostra'}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" aria-label="Tracking email per plantilla">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] font-semibold uppercase tracking-wider opacity-60">
                  <th className="py-2 pr-4">Plantilla</th>
                  <th className="py-2 pr-4">Enviats</th>
                  <th className="py-2 pr-4">Oberts</th>
                  <th className="py-2 pr-4">Clics</th>
                  <th className="py-2 pr-4">Respostes</th>
                  <th className="py-2 pr-4">Open rate</th>
                  <th className="py-2 pr-4">Click rate</th>
                  <th className="py-2">Reply rate</th>
                </tr>
              </thead>
              <tbody>
                {emailTracking.byTemplate.map((row) => (
                  <tr key={row.templateKey} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-medium">{row.label}</td>
                    <td className="py-2 pr-4">{row.totalSent}</td>
                    <td className="py-2 pr-4">{row.opened}</td>
                    <td className="py-2 pr-4">{row.clicked}</td>
                    <td className="py-2 pr-4">{row.replied}</td>
                    <td className="py-2 pr-4">{row.openRate}%</td>
                    <td className="py-2 pr-4">{row.clickRate}%</td>
                    <td className="py-2">{row.replyRate}%</td>
                  </tr>
                ))}
                {emailTracking.byTemplate.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center opacity-50">Sense dades de tracking encara</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Monthly Trend */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold">Tendència mensual (6 mesos)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm" aria-label="Tendència mensual">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] font-semibold uppercase tracking-wider opacity-60">
                  <th className="py-2 pr-4">Mes</th>
                  <th className="py-2 pr-4">Leads</th>
                  <th className="py-2 pr-4">Reserves</th>
                  <th className="py-2">Ingressos</th>
                </tr>
              </thead>
              <tbody>
                {report.monthlyTrend.map((row) => (
                  <tr key={row.month} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-medium">{row.month}</td>
                    <td className="py-2 pr-4">{row.leads}</td>
                    <td className="py-2 pr-4">{row.bookings}</td>
                    <td className="py-2">{currency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Risk Leads */}
        {report.topRiskLeads.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold">Leads en risc (Top 20)</h2>
            <div className="mt-3 space-y-2">
              {report.topRiskLeads.slice(0, 10).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <p className="text-xs font-semibold">{lead.name}</p>
                    <p className="text-[10px] opacity-50">{lead.status} · {lead.source} · score {lead.score}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs opacity-60">{currency(lead.weightedAmount)}</span>
                    <Link
                      href={buildLeadWorkspaceHref(lead.id)}
                      className="rounded border border-white/10 px-2 py-0.5 text-[10px] hover:bg-white/10"
                    >
                      Obrir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminPage>
  );
}
