import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import { prisma } from '@/lib/prisma';
import { estimateLeadAmount, scoreLead } from '@/lib/services/commercialScoring';
import SlaAutomationButton from './SlaAutomationButton';
import SendExecutiveReportButton from './SendExecutiveReportButton';
import RunCommercialSequencesButton from './RunCommercialSequencesButton';

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
  if (status === 'FORT') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  if (status === 'A_MILLORAR') return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  return 'border-rose-500/40 bg-rose-500/10 text-rose-200';
}

function statusPanel(status: AuditStatus) {
  if (status === 'FORT') return 'border-emerald-500/25 bg-emerald-500/5';
  if (status === 'A_MILLORAR') return 'border-amber-500/25 bg-amber-500/5';
  return 'border-rose-500/25 bg-rose-500/5';
}

export default async function SalesOpsPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [leadGroups, leads, slaSnapshot, commSent30d, commResponded30d, sequenceExec30d] = await Promise.all([
    prisma.lead.groupBy({
      by: ['source', 'status', 'assignedTo'],
      _count: true,
    }).catch(() => []),
    prisma.lead.findMany({
      where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
      select: {
        id: true,
        name: true,
        status: true,
        source: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true,
        eventDate: true,
        budget: true,
        phone: true,
        eventLocation: true,
        guestCount: true,
        interestedPackId: true,
        eventType: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    }).catch(() => []),
    prisma.lead.count({
      where: {
        status: 'NEW',
        createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }).catch(() => 0),
    prisma.adminLog.count({
      where: { action: 'COMM_SENT', createdAt: { gte: thirtyDaysAgo } },
    }).catch(() => 0),
    prisma.adminLog.count({
      where: { action: 'COMM_RESPONDED', createdAt: { gte: thirtyDaysAgo } },
    }).catch(() => 0),
    prisma.adminLog.count({
      where: { action: 'COMM_SEQUENCE_EXEC', createdAt: { gte: thirtyDaysAgo } },
    }).catch(() => 0),
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

  const bySource: SourceRow[] = Array.from(sourceMap.entries())
    .map(([source, v]) => ({
      source,
      total: v.total,
      won: v.won,
      winRate: v.total > 0 ? v.won / v.total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const byAssignee: AssigneeRow[] = Array.from(assigneeMap.entries())
    .map(([assignee, v]) => ({
      assignee,
      total: v.total,
      won: v.won,
      winRate: v.total > 0 ? v.won / v.total : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const scored = leads.map((lead) => {
    const scoring = scoreLead({
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      eventDate: lead.eventDate,
      budget: lead.budget,
      phone: lead.phone,
      eventLocation: lead.eventLocation,
      guestCount: lead.guestCount,
      interestedPackId: lead.interestedPackId,
      source: lead.source,
    });
    const amount = estimateLeadAmount({ budget: lead.budget, eventType: lead.eventType });
    return {
      ...lead,
      scoring,
      amount,
      weighted: amount * scoring.probability,
    };
  });

  const forecastTotal = scored.reduce((sum, l) => sum + l.weighted, 0);
  const pipelineTotal = scored.reduce((sum, l) => sum + l.amount, 0);
  const avgScore = scored.length
    ? scored.reduce((sum, l) => sum + l.scoring.score, 0) / scored.length
    : 0;

  const riskLeads = scored
    .filter((lead) => lead.scoring.band === 'LOW' || lead.scoring.riskFlags.length > 0)
    .sort((a, b) => a.scoring.score - b.scoring.score)
    .slice(0, 20);
  const responseRate30d = commSent30d > 0 ? commResponded30d / commSent30d : 0;
  const responseBacklogStatus: AuditStatus = slaSnapshot === 0 ? 'FORT' : slaSnapshot <= 3 ? 'A_MILLORAR' : 'CRITIC';
  const responseRateStatus: AuditStatus = responseRate30d >= 0.55 ? 'FORT' : responseRate30d >= 0.35 ? 'A_MILLORAR' : 'CRITIC';
  const pipelineStatus: AuditStatus = scored.length >= 10 ? 'FORT' : scored.length >= 5 ? 'A_MILLORAR' : 'CRITIC';
  const riskStatus: AuditStatus = riskLeads.length <= 5 ? 'FORT' : riskLeads.length <= 12 ? 'A_MILLORAR' : 'CRITIC';

  const auditRows: Array<{
    area: string;
    status: AuditStatus;
    avui: string;
    en30: string;
    en90: string;
    href: string;
    cta: string;
  }> = [
    {
      area: 'Velocitat de resposta',
      status: responseBacklogStatus,
      avui: `${slaSnapshot} entrades amb +24h sense resposta`,
      en30: 'Deixar-ho a 0 cada dia amb tasques automàtiques.',
      en90: 'Predicció de colls d\'ampolla per franja horària.',
      href: '/admin/leads',
      cta: 'Atacar entrades pendents',
    },
    {
      area: 'Taxa de resposta comercial',
      status: responseRateStatus,
      avui: `${commResponded30d}/${commSent30d} respostes en 30 dies (${toPct(responseRate30d)})`,
      en30: 'Plantilles i seqüències per pujar taxa de resposta.',
      en90: 'A/B testing de missatges per canal i segment.',
      href: '/admin/mensajes',
      cta: 'Optimitzar missatges',
    },
    {
      area: 'Volum de l\'embut',
      status: pipelineStatus,
      avui: `${scored.length} entrades obertes i ${pipelineTotal.toLocaleString('ca-ES')}€ en joc`,
      en30: 'Neteja d\'embut i focus en oportunitats calentes.',
      en90: 'Escalat de captació per canals amb millor win-rate.',
      href: '/admin/leads',
      cta: 'Revisar embut',
    },
    {
      area: 'Risc de pèrdua',
      status: riskStatus,
      avui: `${riskLeads.length} entrades amb risc elevat`,
      en30: 'Pla de recuperació amb seguiment de 48h.',
      en90: 'Sistema preventiu amb alertes abans del risc.',
      href: '/admin/tasks',
      cta: 'Executar tasques crítiques',
    },
    {
      area: 'Bidireccionalitat operativa',
      status: 'FORT',
      avui: 'Lead, client, reserva i calendari ja connectats.',
      en30: 'Cobrir tots els casos límit amb enllaços directes.',
      en90: 'Traçabilitat completa de punta a punta amb historial.',
      href: '/admin',
      cta: 'Obrir centre de comandament',
    },
    {
      area: 'Qualitat de dades',
      status: 'A_MILLORAR',
      avui: 'Deduplicació activa, però cal vigilància diària.',
      en30: 'Control diari de camps crítics incomplets.',
      en90: 'Regles intel·ligents de qualitat en entrada de dades.',
      href: '/admin/clientes',
      cta: 'Revisar duplicats',
    },
    {
      area: 'Operació d\'una sola persona',
      status: 'FORT',
      avui: 'Mode solo + checklist diari automatitzat.',
      en30: 'Macros per blocs de feina repetitiva.',
      en90: 'Pilot automàtic avançat per estalviar hores.',
      href: '/admin/tasks',
      cta: 'Obrir guia de tasques',
    },
    {
      area: 'Visibilitat financera',
      status: 'A_MILLORAR',
      avui: 'Previsió disponible, falta lectura setmanal fixa.',
      en30: 'Revisió setmanal d\'ingressos, marge i cobraments.',
      en90: 'Quadre executiu de marge per tipus d\'esdeveniment.',
      href: '/admin/economia',
      cta: 'Revisar finances',
    },
    {
      area: 'Analítica web i embut',
      status: 'A_MILLORAR',
      avui: 'Analítica disponible, cal ritual d\'anàlisi.',
      en30: 'Informe setmanal amb accions concretes.',
      en90: 'Model d\'atribució simple per decidir inversió.',
      href: '/admin/analytics',
      cta: 'Obrir analítica',
    },
    {
      area: 'Post-esdeveniment i reputació',
      status: 'A_MILLORAR',
      avui: 'Flux actiu, marge de millora en ritme d\'execució.',
      en30: 'Automatitzar més recordatoris i seguiment.',
      en90: 'Bucle de feedback per millorar oferta comercial.',
      href: '/admin/post-event',
      cta: 'Tancar cicle post-esdeveniment',
    },
  ];

  return (
    <AdminPage
      title="Sales Ops"
      subtitle="La teva màquina de vendes: priorització diària, control d'embut i execució sense fricció."
    >

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-sm">💼</p>
          <p className="text-xs">Embut brut</p>
          <p className="text-2xl font-semibold">{pipelineTotal.toLocaleString('ca-ES')}€</p>
          <p className="mt-1 text-[11px]">Valor total de negoci obert</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-sm">🔮</p>
          <p className="text-xs">Previsió ponderada</p>
          <p className="text-2xl font-semibold">{forecastTotal.toLocaleString('ca-ES')}€</p>
          <p className="mt-1 text-[11px]">Ingressos probables segons scoring</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-sm">📥</p>
          <p className="text-xs">Entrades obertes</p>
          <p className="text-2xl font-semibold">{scored.length}</p>
          <p className="mt-1 text-[11px]">Leads actius pendent de tancament</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-sm">🎯</p>
          <p className="text-xs">Puntuació mitjana</p>
          <p className="text-2xl font-semibold">{avgScore.toFixed(1)}</p>
          <p className="mt-1 text-[11px]">Qualitat global de l&apos;embut</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-sm">⏱️</p>
          <p className="text-xs">Entrades sense resposta (&gt;24h)</p>
          <p className="text-2xl font-semibold">{slaSnapshot}</p>
          <p className="mt-1 text-[11px]">Prioritat operativa del dia</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs">Comunicacions 30d</p>
          <p className="text-2xl font-semibold">{commSent30d}</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs">Respostes 30d</p>
          <p className="text-2xl font-semibold">{commResponded30d} · {toPct(responseRate30d)}</p>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs">Seqüències auto 30d</p>
          <p className="text-2xl font-semibold">{sequenceExec30d}</p>
        </div>
      </section>

      <section className="rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Automatització del temps de resposta (24h)</h2>
            <p className="text-sm">
              Si una entrada passa de 24h sense resposta, el sistema crea tasca i eleva prioritat.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/reports/executive"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
            >
              Exportar informe executiu (JSON)
            </a>
            <RunCommercialSequencesButton />
            <SendExecutiveReportButton />
            <SlaAutomationButton />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold">Com llegir aquest panell</h2>
        <p className="mt-1 text-xs">
          Primer mira KPI i alertes, després executa accions (seqüències, SLA i informe), i finalment valida la conversió per origen/comercial.
        </p>
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide">Què és l&apos;embut</p>
          <p className="mt-2 text-sm">Valor total de totes les oportunitats obertes ara mateix.</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide">Previsió ponderada</p>
          <p className="mt-2 text-sm">Ingressos esperats segons probabilitat real de tancament.</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide">Temps de resposta 24h</p>
          <p className="mt-2 text-sm">Entrades noves que no pots deixar més d&apos;un dia sense tocar.</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide">Taxa de resposta</p>
          <p className="mt-2 text-sm">Quantes comunicacions acaben amb resposta del client.</p>
        </div>
      </section>

      <section className="rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Auditoria exhaustiva (avui)</h2>
          <p className="text-xs">Diagnòstic, millora a 30 dies i escalat a 90 dies</p>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {auditRows.map((row) => (
            <article key={row.area} className={`h-full rounded-xl border p-4 ${statusPanel(row.status)}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{row.area}</h3>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(row.status)}`}>
                  {row.status === 'A_MILLORAR' ? 'A millorar' : row.status === 'CRITIC' ? 'Crític' : 'Fort'}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                <p><span className="">Avui:</span> {row.avui}</p>
                <p><span className="">+30 dies:</span> {row.en30}</p>
                <p><span className="">+90 dies:</span> {row.en90}</p>
              </div>
              <div className="mt-3">
                <Link
                  href={row.href}
                  className="inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold"
                >
                  {row.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Pla d&apos;execució a 30 dies</h2>
          <ol className="mt-3 space-y-2 text-sm">
            <li>1. Temps de resposta: deixar cada dia a 0 les entrades de +24h.</li>
            <li>2. Tasques guia: treballar sempre des de la checklist diària.</li>
            <li>3. Pipeline: neteja setmanal de fases i estats sense activitat.</li>
            <li>4. Missatges: optimitzar plantilles per pujar la taxa de resposta.</li>
            <li>5. Dades: control diari de duplicats i camps crítics.</li>
            <li>6. Reserva a calendari: verificar traçabilitat a tots els casos.</li>
          </ol>
        </article>
        <article className="rounded-2xl border p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Pla d&apos;escalat a 90 dies</h2>
          <ol className="mt-3 space-y-2 text-sm">
            <li>1. Predicció: alertes abans que una entrada entri en risc.</li>
            <li>2. Automatització: seqüències per segment i tipus d&apos;esdeveniment.</li>
            <li>3. Quadre executiu: marge i previsió per canal en una sola vista.</li>
            <li>4. Qualitat de dades: regles intel·ligents a la captura inicial.</li>
            <li>5. Post-event: feedback incorporat per millorar proposta comercial.</li>
            <li>6. Operativa solo: més accions en 1 clic i menys canvi de pantalla.</li>
          </ol>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Conversió per origen</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase">
                  <th className="py-2">Origen</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Tancats</th>
                  <th className="py-2">Taxa de tancament</th>
                </tr>
              </thead>
              <tbody>
                {bySource.map((row) => (
                  <tr key={row.source} className="border-b">
                    <td className="py-2 font-medium">{row.source}</td>
                    <td className="py-2">{row.total}</td>
                    <td className="py-2">{row.won}</td>
                    <td className="py-2">{toPct(row.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Conversió per comercial</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase">
                  <th className="py-2">Comercial</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Tancats</th>
                  <th className="py-2">Taxa de tancament</th>
                </tr>
              </thead>
              <tbody>
                {byAssignee.map((row) => (
                  <tr key={row.assignee} className="border-b">
                    <td className="py-2 font-medium">{row.assignee}</td>
                    <td className="py-2">{row.total}</td>
                    <td className="py-2">{row.won}</td>
                    <td className="py-2">{toPct(row.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Entrades en risc (prioritzar avui)</h2>
        <div className="mt-4 space-y-2">
          {riskLeads.length === 0 ? (
            <p className="text-sm">Sense riscos rellevants.</p>
          ) : (
            riskLeads.map((lead) => (
              <div key={lead.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {lead.name} · {lead.status} · puntuació {lead.scoring.score}
                  </p>
                  <p className="text-xs">
                    Prob. {toPct(lead.scoring.probability)} · {lead.weighted.toLocaleString('ca-ES')}€
                  </p>
                </div>
                {lead.scoring.riskFlags.length > 0 && (
                  <p className="mt-1 text-xs">
                    Riscos: {lead.scoring.riskFlags.join(', ')}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="rounded-lg border px-2.5 py-1 text-xs font-medium"
                  >
                    Obrir entrada
                  </Link>
                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AdminPage>
  );
}
