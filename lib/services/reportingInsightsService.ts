import { formatCurrencyExact } from '@/lib/constants';
import type { ExecutiveReport } from './executiveReportService';

export type InsightPriority = 'critical' | 'warning' | 'positive';

export type ReportingInsight = {
  priority: InsightPriority;
  area: string;
  headline: string;
  detail: string;
  href: string;
  ctaLabel: string;
  secondaryAction?: { href: string; label: string };
};

const PRIORITY_ORDER: Record<InsightPriority, number> = { critical: 0, warning: 1, positive: 2 };

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function generateReportingInsights(
  report: ExecutiveReport,
  opts: { emailOpenRate?: number; emailReplyRate?: number } = {}
): ReportingInsight[] {
  const insights: ReportingInsight[] = [];
  const { marginRate, totalRevenue } = report.margin;
  const { returningRate, totalCustomers, returning } = report.recurrence;
  const { emailOpenRate = 1, emailReplyRate = 1 } = opts;

  if (report.headline.slaBroken > 0) {
    insights.push({
      priority: 'critical',
      area: 'Operatiu',
      headline: `${report.headline.slaBroken} SLA trencats contaminen el reporting`,
      detail: `Amb leads fora de SLA les mètriques de conversió i resposta es distorsionen. Cal resolver primer els SLA trencats per llegir conclusions netes.`,
      href: '/admin/leads',
      ctaLabel: 'Obrir leads',
      secondaryAction: { href: '/admin/sales-ops', label: 'Veure Sales Ops' },
    });
  }

  if (report.headline.openLeads === 0 && report.headline.pipelineRaw === 0) {
    insights.push({
      priority: 'warning',
      area: 'Pipeline',
      headline: 'Pipeline buit — captació parada',
      detail: 'No hi ha leads oberts ni pipeline actiu. El reporting no pot avançar sense entrades noves al funnel.',
      href: '/admin/leads',
      ctaLabel: 'Crear lead',
      secondaryAction: { href: '/admin/sales-ops', label: 'Revisar sales ops' },
    });
  }

  if (marginRate < 0.55 && totalRevenue > 0) {
    insights.push({
      priority: 'warning',
      area: 'Finances',
      headline: `Marge brut baix: ${pct(marginRate)}`,
      detail: `La taxa de marge brut és del ${pct(marginRate)}, per sota del 55% objectiu. El proper pas és revisar pricing o estructura de costos directes.`,
      href: '/admin/pricing',
      ctaLabel: 'Revisar preus',
      secondaryAction: { href: '/admin/economia', label: 'Mirar finances' },
    });
  }

  if (returningRate < 0.3 && totalCustomers >= 5) {
    insights.push({
      priority: 'warning',
      area: 'Recurrència',
      headline: `Recurrència baixa: ${pct(returningRate)} de clients tornen`,
      detail: `Només ${returning} de ${totalCustomers} clients han repetit. Reforçar Customer Hub, post-event i referrals per consolidar base fidel.`,
      href: '/admin/clientes',
      ctaLabel: 'Obrir clients',
      secondaryAction: { href: '/admin/clientes/referrals', label: 'Veure referrals' },
    });
  }

  if (report.monthlyTrend.length >= 3) {
    const t = report.monthlyTrend;
    const last = t[t.length - 1];
    const prev = t[t.length - 2];
    const prev2 = t[t.length - 3];
    if (last.revenue < prev.revenue && prev.revenue < prev2.revenue && prev2.revenue > 0) {
      insights.push({
        priority: 'warning',
        area: 'Tendència',
        headline: 'Ingressos en caiguda els últims 3 mesos',
        detail: `${prev2.month}: ${formatCurrencyExact(prev2.revenue)} → ${prev.month}: ${formatCurrencyExact(prev.revenue)} → ${last.month}: ${formatCurrencyExact(last.revenue)}. La tendència és negativa.`,
        href: '/admin/reporting',
        ctaLabel: 'Veure tendència',
        secondaryAction: { href: '/admin/sales-ops', label: 'Obrir Sales Ops' },
      });
    }
  }

  const { CONTACTED = 0, QUOTE_SENT = 0, NEGOTIATING = 0, NEW: newLeads = 0 } = report.funnel;
  if (CONTACTED > 0 && QUOTE_SENT === 0 && NEGOTIATING === 0 && newLeads + CONTACTED > 3) {
    insights.push({
      priority: 'warning',
      area: 'Funnel',
      headline: `${CONTACTED} leads contactats sense pressupostos enviats`,
      detail: `L'embut s'ha aturat entre "Contactat" i "Pressupost enviat". Cal activar els pressupostos pendents per desbloquejar la conversió.`,
      href: '/admin/leads',
      ctaLabel: 'Veure leads contactats',
    });
  }

  if (report.topRiskLeads.length > 0 && report.headline.slaBroken === 0) {
    insights.push({
      priority: 'warning',
      area: 'Risc',
      headline: `${report.topRiskLeads.length} leads en risc alt`,
      detail: `El lead de pitjor score és "${report.topRiskLeads[0].name}" (score ${report.topRiskLeads[0].score}). Prioritzar seguiment actiu.`,
      href: '/admin/leads',
      ctaLabel: 'Veure leads en risc',
      secondaryAction: { href: '/admin/sales-ops', label: 'Revisió Sales Ops' },
    });
  }

  if (emailOpenRate < 0.35 || emailReplyRate < 0.08) {
    insights.push({
      priority: 'warning',
      area: 'Email',
      headline: `Rendiment d'email per sota dels objectius`,
      detail: `Open rate: ${pct(emailOpenRate)}, reply rate: ${pct(emailReplyRate)}. Revisa les plantilles de menor rendiment per millorar l'impacte.`,
      href: '/admin/emails',
      ctaLabel: 'Revisar emails',
    });
  }

  const bestSource = report.conversionBySource
    .filter((s) => s.total >= 3)
    .sort((a, b) => b.winRate - a.winRate)[0];
  if (bestSource && bestSource.winRate > 0.4) {
    insights.push({
      priority: 'positive',
      area: 'Conversió',
      headline: `Canal més fort: ${bestSource.source} (${pct(bestSource.winRate)} win rate)`,
      detail: `${bestSource.won} de ${bestSource.total} leads de "${bestSource.source}" s'han tancat. Empènyer aquest canal per maximitzar conversió.`,
      href: '/admin/analytics',
      ctaLabel: 'Veure analítica',
    });
  }

  return insights.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
