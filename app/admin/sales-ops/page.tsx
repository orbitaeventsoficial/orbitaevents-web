import Link from 'next/link';
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

function toPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
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

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Sales Ops</h1>
        <p className="mt-1 text-sm text-slate-500">
          Forecast, conversión por canal/comercial y automatización SLA.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pipeline bruto</p>
          <p className="text-2xl font-semibold text-slate-800">{pipelineTotal.toLocaleString('ca-ES')}€</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Forecast ponderado</p>
          <p className="text-2xl font-semibold text-slate-800">{forecastTotal.toLocaleString('ca-ES')}€</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Leads abiertos</p>
          <p className="text-2xl font-semibold text-slate-800">{scored.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Score medio</p>
          <p className="text-2xl font-semibold text-slate-800">{avgScore.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">SLA NEW roto (+24h)</p>
          <p className="text-2xl font-semibold text-amber-700">{slaSnapshot}</p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Comunicaciones 30d</p>
          <p className="text-2xl font-semibold text-slate-800">{commSent30d}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Respondidas 30d</p>
          <p className="text-2xl font-semibold text-slate-800">{commResponded30d} · {toPct(responseRate30d)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Secuencias auto 30d</p>
          <p className="text-2xl font-semibold text-slate-800">{sequenceExec30d}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Automatización SLA</h2>
            <p className="text-sm text-slate-500">
              Crea tarea automática y eleva prioridad en leads NEW fuera de SLA.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/reports/executive"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Exportar reporte ejecutivo (JSON)
            </a>
            <RunCommercialSequencesButton />
            <SendExecutiveReportButton />
            <SlaAutomationButton />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Conversión por fuente</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Fuente</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">WON</th>
                  <th className="py-2">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {bySource.map((row) => (
                  <tr key={row.source} className="border-b border-stone-100">
                    <td className="py-2 font-medium text-slate-700">{row.source}</td>
                    <td className="py-2 text-slate-700">{row.total}</td>
                    <td className="py-2 text-slate-700">{row.won}</td>
                    <td className="py-2 text-slate-700">{toPct(row.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Conversión por comercial</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Comercial</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">WON</th>
                  <th className="py-2">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {byAssignee.map((row) => (
                  <tr key={row.assignee} className="border-b border-stone-100">
                    <td className="py-2 font-medium text-slate-700">{row.assignee}</td>
                    <td className="py-2 text-slate-700">{row.total}</td>
                    <td className="py-2 text-slate-700">{row.won}</td>
                    <td className="py-2 text-slate-700">{toPct(row.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Leads en riesgo (priorizar hoy)</h2>
        <div className="mt-4 space-y-2">
          {riskLeads.length === 0 ? (
            <p className="text-sm text-slate-500">Sin riesgos relevantes.</p>
          ) : (
            riskLeads.map((lead) => (
              <div key={lead.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {lead.name} · {lead.status} · score {lead.scoring.score}
                  </p>
                  <p className="text-xs text-slate-500">
                    Prob. {toPct(lead.scoring.probability)} · {lead.weighted.toLocaleString('ca-ES')}€
                  </p>
                </div>
                {lead.scoring.riskFlags.length > 0 && (
                  <p className="mt-1 text-xs text-rose-700">
                    Riesgos: {lead.scoring.riskFlags.join(', ')}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Abrir lead
                  </Link>
                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-green-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-600"
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
    </div>
  );
}
