import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { prisma } from '@/lib/prisma';
import { formatNumber } from '@/lib/constants';
import { estimateLeadAmount, scoreLead } from '@/lib/services/commercialScoring';
import {
  fetchRecentCanonicalCommunicationMetrics,
  fetchRecentCommercialSequenceMetrics,
} from '@/lib/services/timelineQueryService';
import { AdminPage } from '../components/AdminPage';
import InfoTooltip from '../components/InfoTooltip';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import LossBreakdownPanel from './LossBreakdownPanel';
import RunCommercialSequencesButton from './RunCommercialSequencesButton';
import SendExecutiveReportButton from './SendExecutiveReportButton';
import SlaAutomationButton from './SlaAutomationButton';
import { loadLossReport } from '@/lib/services/leadLossAnalyticsService';

export const dynamic = 'force-dynamic';

type SourceRow = {
  source: string;
  total: number;
  won: number;
  winRate: number;
};

type AssigneeRow = {
  assignee: string;
  total: number;
  won: number;
  winRate: number;
};

type AuditStatus = 'FORT' | 'A_MILLORAR' | 'CRITIC';

function toPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function statusBadge(status: AuditStatus) {
  if (status === 'FORT') return 'ap-badge ap-badge--success';
  if (status === 'A_MILLORAR') return 'ap-badge ap-badge--warning';
  return 'ap-badge ap-badge--danger';
}

function statusPanel(status: AuditStatus) {
  if (status === 'FORT') return 'ap-card ap-card--success';
  if (status === 'A_MILLORAR') return 'ap-card ap-card--warning';
  return 'ap-card ap-card--danger';
}

export default async function SalesOpsPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [leadGroups, leads, slaSnapshot, commMetrics30d, sequenceExec30d, lossSummary] = await Promise.all([
    prisma.lead.groupBy({ by: ['source', 'status', 'assignedTo'], _count: true }).catch(() => []),
    prisma.lead.findMany({
      where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
      select: {
        id: true, name: true, status: true, source: true, assignedTo: true, createdAt: true, updatedAt: true,
        eventDate: true, budget: true, phone: true, eventLocation: true, guestCount: true, interestedPackId: true, eventType: true,
      },
      orderBy: { createdAt: 'desc' }, take: 1000,
    }).catch(() => []),
    prisma.lead.count({ where: { status: 'NEW', createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }).catch(() => 0),
    fetchRecentCanonicalCommunicationMetrics(thirtyDaysAgo),
    fetchRecentCommercialSequenceMetrics(thirtyDaysAgo),
    loadLossReport({ sinceDays: 90 }).catch(() => ({
      total: 0,
      uncategorized: 0,
      autoTotal: 0,
      commercialTotal: 0,
      byReason: [],
      byEventType: [],
      bySource: [],
      byMonth: [],
      topReason: null,
    })),
  ]);

  const sourceMap = new Map<string, { total: number; won: number }>();
  const assigneeMap = new Map<string, { total: number; won: number }>();

  leadGroups.forEach((g) => {
    const sourceKey = g.source || 'UNKNOWN';
    const assigneeKey = g.assignedTo || 'UNASSIGNED';
    const source = sourceMap.get(sourceKey) || { total: 0, won: 0 };
    const assignee = assigneeMap.get(assigneeKey) || { total: 0, won: 0 };
    source.total += g._count;
    assignee.total += g._count;
    if (g.status === 'WON') {
      source.won += g._count;
      assignee.won += g._count;
    }
    sourceMap.set(sourceKey, source);
    assigneeMap.set(assigneeKey, assignee);
  });

  const bySource: SourceRow[] = Array.from(sourceMap.entries()).map(([source, v]) => ({ source, total: v.total, won: v.won, winRate: v.total > 0 ? v.won / v.total : 0 })).sort((a, b) => b.total - a.total);
  const byAssignee: AssigneeRow[] = Array.from(assigneeMap.entries()).map(([assignee, v]) => ({ assignee, total: v.total, won: v.won, winRate: v.total > 0 ? v.won / v.total : 0 })).sort((a, b) => b.total - a.total);

  const scored = leads.map((lead) => {
    const scoring = scoreLead({
      status: lead.status, createdAt: lead.createdAt, updatedAt: lead.updatedAt, eventDate: lead.eventDate,
      budget: lead.budget, phone: lead.phone, eventLocation: lead.eventLocation, guestCount: lead.guestCount,
      interestedPackId: lead.interestedPackId, source: lead.source,
    });
    const amount = estimateLeadAmount({ budget: lead.budget, eventType: lead.eventType });
    return { ...lead, scoring, amount, weighted: amount * scoring.probability };
  });

  const forecastTotal = scored.reduce((sum, l) => sum + l.weighted, 0);
  const pipelineTotal = scored.reduce((sum, l) => sum + l.amount, 0);
  const avgScore = scored.length ? scored.reduce((sum, l) => sum + l.scoring.score, 0) / scored.length : 0;
  const riskLeads = scored.filter((lead) => lead.scoring.band === 'LOW' || lead.scoring.riskFlags.length > 0).sort((a, b) => a.scoring.score - b.scoring.score).slice(0, 20);
  const commSent30d = commMetrics30d.commSent;
  const commResponded30d = commMetrics30d.commResponded;
  const responseRate30d = commSent30d > 0 ? commResponded30d / commSent30d : 0;
  const responseBacklogStatus: AuditStatus = slaSnapshot === 0 ? 'FORT' : slaSnapshot <= 3 ? 'A_MILLORAR' : 'CRITIC';
  const responseRateStatus: AuditStatus = responseRate30d >= 0.55 ? 'FORT' : responseRate30d >= 0.35 ? 'A_MILLORAR' : 'CRITIC';
  const pipelineStatus: AuditStatus = scored.length >= 10 ? 'FORT' : scored.length >= 5 ? 'A_MILLORAR' : 'CRITIC';
  const riskStatus: AuditStatus = riskLeads.length <= 5 ? 'FORT' : riskLeads.length <= 12 ? 'A_MILLORAR' : 'CRITIC';
  const systemItems = [
    `${scored.length} entrades obertes amb ${formatNumber(pipelineTotal)}€ a l'embut`,
    `Previsió ponderada actual: ${formatNumber(forecastTotal)}€`,
    `${sequenceExec30d.sequenceExec} seqüències automàtiques executades en 30 dies`,
    `Taxa de resposta comercial del ${toPct(responseRate30d)}`,
  ].filter(Boolean);
  const manualItems = [
    slaSnapshot > 0 ? `${slaSnapshot} entrades porten més de 24h sense resposta` : '',
    riskLeads.length > 0 ? `${riskLeads.length} oportunitats ja presenten risc de pèrdua` : '',
    responseRateStatus !== 'FORT' ? 'La taxa de resposta comercial encara demana optimitzar missatges i seguiment' : '',
    'Cal mantenir net l\'embut i revisar duplicats o camps crítics',
  ].filter(Boolean);

  const nextStep =
    slaSnapshot > 0
      ? {
          title: 'Desbloquejar el temps de resposta avui',
          detail: `Hi ha ${slaSnapshot} entrades amb més de 24h sense tocar. La prioritat és atacar-les abans de mirar optimització fina.`,
          href: '/admin/leads',
          ctaLabel: 'Obrir entrades',
          secondaryAction: { href: '/admin/tasks', label: 'Veure tasques crítiques' },
        }
      : riskLeads.length > 0
        ? {
            title: 'Recuperar oportunitats en risc abans que es refredin',
            detail: `${riskLeads.length} leads ja acumulen senyals de pèrdua. El següent pas és executar seguiment amb context, no només mirar mètriques.`,
            href: '/admin/tasks',
            ctaLabel: 'Executar seguiment',
            secondaryAction: { href: '/admin/leads', label: 'Obrir embut' },
          }
        : {
            title: 'Optimitzar el pipeline, no apagar focs',
            detail: `El sistema no detecta un coll d'ampolla crític ara mateix. El millor retorn és revisar conversió, missatges i origen per pujar qualitat i tancament.`,
            href: '/admin/leads',
            ctaLabel: 'Revisar embut',
            secondaryAction: { href: '/admin/analytics', label: 'Mirar analítica' },
          };

  const auditRows = [
    { area: 'Velocitat de resposta', status: responseBacklogStatus, avui: `${slaSnapshot} entrades amb +24h sense resposta`, en30: 'Deixar-ho a 0 cada dia amb tasques automàtiques.', en90: 'Predicció de colls d\'ampolla per franja horària.', href: '/admin/leads', cta: 'Atacar entrades pendents' },
    { area: 'Taxa de resposta comercial', status: responseRateStatus, avui: `${commResponded30d}/${commSent30d} respostes en 30 dies (${toPct(responseRate30d)})`, en30: 'Plantilles i seqüències per pujar taxa de resposta.', en90: 'A/B testing de missatges per canal i segment.', href: '/admin/mensajes', cta: 'Optimitzar missatges' },
    { area: 'Volum de l\'embut', status: pipelineStatus, avui: `${scored.length} entrades obertes i ${formatNumber(pipelineTotal)}€ en joc`, en30: 'Neteja d\'embut i focus en oportunitats calentes.', en90: 'Escalat de captació per canals amb millor win-rate.', href: '/admin/leads', cta: 'Revisar embut' },
    { area: 'Risc de pèrdua', status: riskStatus, avui: `${riskLeads.length} entrades amb risc elevat`, en30: 'Pla de recuperació amb seguiment de 48h.', en90: 'Sistema preventiu amb alertes abans del risc.', href: '/admin/tasks', cta: 'Executar tasques crítiques' },
    { area: 'Bidireccionalitat operativa', status: 'FORT' as AuditStatus, avui: 'Lead, client, reserva i calendari ja connectats.', en30: 'Cobrir tots els casos límit amb enllaços directes.', en90: 'Traçabilitat completa de punta a punta amb historial.', href: '/admin', cta: 'Obrir centre de comandament' },
    { area: 'Qualitat de dades', status: 'A_MILLORAR' as AuditStatus, avui: 'Deduplicació activa, però cal vigilància diària.', en30: 'Control diari de camps crítics incomplets.', en90: 'Regles intel·ligents de qualitat en entrada de dades.', href: '/admin/clientes', cta: 'Revisar duplicats' },
    { area: 'Operació d\'una sola persona', status: 'FORT' as AuditStatus, avui: 'Mode solo + checklist diari automatitzat.', en30: 'Macros per blocs de feina repetitiva.', en90: 'Pilot automàtic avançat per estalviar hores.', href: '/admin/tasks', cta: 'Obrir guia de tasques' },
    { area: 'Visibilitat financera', status: 'A_MILLORAR' as AuditStatus, avui: 'Previsió disponible, falta lectura setmanal fixa.', en30: 'Revisió setmanal d\'ingressos, marge i cobraments.', en90: 'Quadre executiu de marge per tipus d\'esdeveniment.', href: '/admin/economia', cta: 'Revisar finances' },
    { area: 'Analítica web i embut', status: 'A_MILLORAR' as AuditStatus, avui: 'Analítica disponible, cal ritual d\'anàlisi.', en30: 'Informe setmanal amb accions concretes.', en90: 'Model d\'atribució simple per decidir inversió.', href: '/admin/analytics', cta: 'Obrir analítica' },
    { area: 'Post-esdeveniment i reputació', status: 'A_MILLORAR' as AuditStatus, avui: 'Flux actiu, marge de millora en ritme d\'execució.', en30: 'Automatitzar més recordatoris i seguiment.', en90: 'Bucle de feedback per millorar oferta comercial.', href: '/admin/post-event', cta: 'Tancar cicle post-esdeveniment' },
  ];

  return (
    <AdminPage title="Sales Ops" subtitle="La teva màquina de vendes: priorització diària, control d'embut i execució sense fricció.">
      <section className="ap-kpi-row xl:grid-cols-5">
        <div className="ap-kpi"><p className="text-sm">💼</p><p className="ap-kpi-label">Embut brut <InfoTooltip text="Suma del valor estimat de totes les entrades obertes (no tancades ni descartades). Indica el potencial màxim teòric de vendes." /></p><p className="ap-kpi-value">{formatNumber(pipelineTotal)}€</p><p className="ap-kpi-trend">Valor total de negoci obert</p></div>
        <div className="ap-kpi ap-kpi--info"><p className="text-sm">🔮</p><p className="ap-kpi-label">Previsió ponderada <InfoTooltip text="Valor esperat d'ingressos ajustat per la probabilitat de tancament de cada lead (scoring). Més fiable que l'embut brut." /></p><p className="ap-kpi-value">{formatNumber(forecastTotal)}€</p><p className="ap-kpi-trend">Ingressos probables segons scoring</p></div>
        <div className="ap-kpi"><p className="text-sm">📥</p><p className="ap-kpi-label">Entrades obertes <InfoTooltip text="Nombre de leads actius que encara no s'han convertit en reserva ni descartat." /></p><p className="ap-kpi-value">{scored.length}</p><p className="ap-kpi-trend">Leads actius pendent de tancament</p></div>
        <div className="ap-kpi"><p className="text-sm">🎯</p><p className="ap-kpi-label">Puntuació mitjana <InfoTooltip text="Qualitat mitjana dels leads oberts. Pondera urgència, pressupost, canal d'entrada i activitat. Per sobre de 60 indica un embut saludable." /></p><p className="ap-kpi-value">{avgScore.toFixed(1)}</p><p className="ap-kpi-trend">Qualitat global de l'embut</p></div>
        <div className="ap-kpi ap-kpi--warning"><p className="text-sm">⏱️</p><p className="ap-kpi-label">Entrades sense resposta (&gt;24h) <InfoTooltip text="Leads que porten més de 24h sense cap resposta. El sistema crea una tasca i eleva la prioritat automàticament." /></p><p className="ap-kpi-value">{slaSnapshot}</p><p className="ap-kpi-trend">Prioritat operativa del dia</p></div>
      </section>

      <section className="ap-kpi-row xl:grid-cols-3">
        <div className="ap-kpi"><p className="ap-kpi-label">Comunicacions 30d <InfoTooltip text="Total d'emails, missatges i trucades enviats en els últims 30 dies a leads i clients." /></p><p className="ap-kpi-value">{commSent30d}</p></div>
        <div className="ap-kpi ap-kpi--info"><p className="ap-kpi-label">Respostes 30d <InfoTooltip text="Comunicacions que han rebut resposta del client. Un % alt indica bona qualitat de contacte." /></p><p className="ap-kpi-value">{commResponded30d} · {toPct(responseRate30d)}</p></div>
        <div className="ap-kpi"><p className="ap-kpi-label">Seqüències auto 30d <InfoTooltip text="Missatges automàtics enviats pel sistema (follow-ups, recordatoris, seqüències comercials)." /></p><p className="ap-kpi-value">{sequenceExec30d.sequenceExec}</p></div>
      </section>

      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què vigila el sistema',
          tone: responseBacklogStatus === 'CRITIC' || responseRateStatus === 'CRITIC' ? 'warning' : 'info',
          items: systemItems,
          emptyText: 'Sense senyals automàtiques rellevants ara mateix.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On et cal intervenir',
          tone: slaSnapshot > 0 || riskLeads.length > 0 ? 'warning' : 'success',
          items: manualItems,
          emptyText: 'Sense bloquejos manuals greus. Pots treballar millora i optimització.',
        }}
        nextStep={{
          eyebrow: 'Següent pas',
          ...nextStep,
        }}
      />

      <LossBreakdownPanel initialSummary={lossSummary} days={90} />

      <section className="ap-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Automatització del temps de resposta (24h)</h2>
            <p className="text-sm admin-tone-text-neutral">Si una entrada passa de 24h sense resposta, el sistema crea tasca i eleva prioritat.</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/admin/reports/executive" target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--secondary">Exportar informe executiu (JSON)</a>
            <RunCommercialSequencesButton />
            <SendExecutiveReportButton />
            <SlaAutomationButton />
          </div>
        </div>
      </section>

      <section className="ap-card rounded-2xl p-4">
        <h2 className="text-sm font-semibold">Com llegir aquest panell</h2>
        <p className="mt-1 text-xs admin-tone-text-neutral">Primer mira KPI i alertes, després executa accions, i finalment valida la conversió per origen/comercial.</p>
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <div className="ap-card rounded-xl p-4"><p className="text-xs font-semibold uppercase tracking-wide">Què és l'embut</p><p className="mt-2 text-sm admin-tone-text-neutral">Valor total de totes les oportunitats obertes ara mateix.</p></div>
        <div className="ap-card rounded-xl p-4"><p className="text-xs font-semibold uppercase tracking-wide">Previsió ponderada</p><p className="mt-2 text-sm admin-tone-text-neutral">Ingressos esperats segons probabilitat real de tancament.</p></div>
        <div className="ap-card rounded-xl p-4"><p className="text-xs font-semibold uppercase tracking-wide">Temps de resposta 24h</p><p className="mt-2 text-sm admin-tone-text-neutral">Entrades noves que no pots deixar més d'un dia sense tocar.</p></div>
        <div className="ap-card rounded-xl p-4"><p className="text-xs font-semibold uppercase tracking-wide">Taxa de resposta</p><p className="mt-2 text-sm admin-tone-text-neutral">Quantes comunicacions acaben amb resposta del client.</p></div>
      </section>

      <section className="ap-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Auditoria exhaustiva (avui)</h2>
          <p className="text-xs admin-tone-text-neutral">Diagnòstic, millora a 30 dies i escalat a 90 dies</p>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {auditRows.map((row) => (
            <article key={row.area} className={`${statusPanel(row.status)} h-full rounded-xl p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{row.area}</h3>
                <span className={statusBadge(row.status)}>{row.status === 'A_MILLORAR' ? 'A millorar' : row.status === 'CRITIC' ? 'Crític' : 'Fort'}</span>
              </div>
              <div className="mt-2 space-y-1.5 text-xs admin-tone-text-neutral">
                <p><span className="font-semibold">Avui:</span> {row.avui}</p>
                <p><span className="font-semibold">+30 dies:</span> {row.en30}</p>
                <p><span className="font-semibold">+90 dies:</span> {row.en90}</p>
              </div>
              <div className="mt-3"><Link href={row.href} className="ap-btn ap-btn--secondary text-xs">{row.cta}</Link></div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="ap-card rounded-2xl p-5"><h2 className="text-lg font-semibold">Pla d'execució a 30 dies</h2><ol className="mt-3 space-y-2 text-sm admin-tone-text-neutral"><li>1. Temps de resposta: deixar cada dia a 0 les entrades de +24h.</li><li>2. Tasques guia: treballar sempre des de la checklist diària.</li><li>3. Pipeline: neteja setmanal de fases i estats sense activitat.</li><li>4. Missatges: optimitzar plantilles per pujar la taxa de resposta.</li><li>5. Dades: control diari de duplicats i camps crítics.</li><li>6. Reserva a calendari: verificar traçabilitat a tots els casos.</li></ol></article>
        <article className="ap-card rounded-2xl p-5"><h2 className="text-lg font-semibold">Pla d'escalat a 90 dies</h2><ol className="mt-3 space-y-2 text-sm admin-tone-text-neutral"><li>1. Predicció: alertes abans que una entrada entri en risc.</li><li>2. Automatització: seqüències per segment i tipus d'esdeveniment.</li><li>3. Quadre executiu: marge i previsió per canal en una sola vista.</li><li>4. Qualitat de dades: regles intel·ligents a la captura inicial.</li><li>5. Post-event: feedback incorporat per millorar proposta comercial.</li><li>6. Operativa solo: més accions en 1 clic i menys canvi de pantalla.</li></ol></article>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="ap-card rounded-2xl p-5"><h2 className="text-lg font-semibold">Conversió per origen</h2><div className="mt-4 ap-table-wrap border-0"><table className="ap-table min-w-full text-sm" aria-label="Conversió per origen"><thead className="ap-table-head"><tr><th scope="col" className="ap-table-th">Origen</th><th scope="col" className="ap-table-th">Total</th><th scope="col" className="ap-table-th">Tancats</th><th scope="col" className="ap-table-th">Taxa de tancament</th></tr></thead><tbody className="ap-table-body">{bySource.map((row) => (<tr key={row.source}><td className="py-2 font-medium">{row.source}</td><td className="py-2">{row.total}</td><td className="py-2">{row.won}</td><td className="py-2">{toPct(row.winRate)}</td></tr>))}</tbody></table></div></section>
        <section className="ap-card rounded-2xl p-5"><h2 className="text-lg font-semibold">Conversió per comercial</h2><div className="mt-4 ap-table-wrap border-0"><table className="ap-table min-w-full text-sm" aria-label="Conversió per comercial"><thead className="ap-table-head"><tr><th scope="col" className="ap-table-th">Comercial</th><th scope="col" className="ap-table-th">Total</th><th scope="col" className="ap-table-th">Tancats</th><th scope="col" className="ap-table-th">Taxa de tancament</th></tr></thead><tbody className="ap-table-body">{byAssignee.map((row) => (<tr key={row.assignee}><td className="py-2 font-medium">{row.assignee}</td><td className="py-2">{row.total}</td><td className="py-2">{row.won}</td><td className="py-2">{toPct(row.winRate)}</td></tr>))}</tbody></table></div></section>
      </div>

      <section className="ap-card rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Entrades en risc (prioritzar avui)</h2>
        <div className="mt-4 space-y-2">
          {riskLeads.length === 0 ? (
            <p className="text-sm admin-tone-text-neutral">Sense riscos rellevants.</p>
          ) : (
            riskLeads.map((lead) => (
              <div key={lead.id} className="ap-card rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{lead.name} · {lead.status} · puntuació {lead.scoring.score}</p>
                  <p className="text-xs admin-tone-text-slate">Prob. {toPct(lead.scoring.probability)} · {formatNumber(lead.weighted)}€</p>
                </div>
                {lead.scoring.riskFlags.length > 0 && <p className="mt-1 text-xs admin-tone-text-neutral">Riscos: {lead.scoring.riskFlags.join(', ')}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={buildLeadWorkspaceHref(lead.id)} className="ap-btn ap-btn--secondary text-xs">Obrir entrada</Link>
                  {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--primary text-xs">WhatsApp</a>}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AdminPage>
  );
}
