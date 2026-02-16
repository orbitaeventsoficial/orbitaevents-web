import Link from 'next/link';
import { buildProfitabilityReport, normalizeProfitabilityConfig } from '@/lib/services/profitabilityService';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import ProfitabilityConfigEditor from './ProfitabilityConfigEditor';
import ProfitabilityConfigHistory from './ProfitabilityConfigHistory';

export const dynamic = 'force-dynamic';

function money(value: number) {
  return `${value.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€`;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function RentabilidadPage() {
  let report: Awaited<ReturnType<typeof buildProfitabilityReport>> | null = null;
  let reportError = false;

  try {
    report = await buildProfitabilityReport();
  } catch (error) {
    reportError = true;
    log.error('Error generant informe de rendibilitat', error);
    try {
      await prisma.adminLog.create({
        data: {
          userId: 'system',
          entity: 'report',
          entityId: 'profitability',
          action: 'ERROR',
          details: {
            message: error instanceof Error ? error.message : 'Error de rendibilitat desconegut',
          },
        },
      });
    } catch {
      // Ignore logging failures to keep page non-blocking.
    }
  }

  const historyLogs = await prisma.adminLog.findMany({
    where: {
      entity: 'setting',
      entityId: 'finance.profitabilityConfig',
      action: 'UPDATE',
    },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });
  const historyEntries = historyLogs
    .map((logItem) => {
      const details = (logItem.details && typeof logItem.details === 'object'
        ? (logItem.details as Record<string, unknown>)
        : {}) as Record<string, unknown>;
      const before = normalizeProfitabilityConfig(details.before);
      const after = normalizeProfitabilityConfig(details.after);
      return {
        id: logItem.id,
        createdAt: logItem.createdAt.toISOString(),
        role: typeof details.role === 'string' ? details.role : 'OWNER',
        before,
        after,
      };
    });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-100">Rendibilitat executiva</h1>
        <p className="mt-1 text-sm text-slate-400">
          Marge per esdeveniment, risc i retorn per canal comercial.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/api/admin/reports/profitability"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            Exportar JSON
          </a>
          <Link
            href="/admin/sales-ops"
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            Anar a Sales Ops
          </Link>
        </div>
      </header>

      {!report && (
        <section className="rounded-2xl border border-amber-300/30 bg-amber-950/30 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-200">No hi ha dades disponibles</h2>
          <p className="mt-1 text-sm text-amber-100/90">
            {reportError
              ? 'Hi ha hagut un error calculant la rendibilitat. Pots continuar operant i revisar la configuració.'
              : 'Encara no hi ha dades suficients per calcular la rendibilitat.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/admin/settings/integrations"
              className="rounded-lg border border-amber-300/40 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/20"
            >
              Configurar integracions
            </Link>
            <Link
              href="/admin/bookings"
              className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
            >
              Revisar reserves
            </Link>
          </div>
        </section>
      )}

      {report && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
              <p className="text-xs text-slate-400">Ingressos realitzats</p>
              <p className="text-2xl font-semibold text-slate-100">{money(report.realized.revenue)}</p>
              <p className="text-xs text-slate-400">{report.realized.bookings} esdeveniments completats</p>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-4 shadow-sm">
              <p className="text-xs text-emerald-300">Marge net realitzat</p>
              <p className="text-2xl font-semibold text-emerald-300">{money(report.realized.netMargin)}</p>
              <p className="text-xs text-emerald-300">Marge mitjà {pct(report.realized.avgMarginPct)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-sm">
              <p className="text-xs text-slate-400">Previsió d'ingressos</p>
              <p className="text-2xl font-semibold text-slate-100">{money(report.forecast.revenue)}</p>
              <p className="text-xs text-slate-400">{report.forecast.bookings} esdeveniments en pipeline</p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-4 shadow-sm">
              <p className="text-xs text-amber-300">Previsió de marge</p>
              <p className="text-2xl font-semibold text-amber-300">{money(report.forecast.netMargin)}</p>
              <p className="text-xs text-amber-300">Marge mitjà {pct(report.forecast.avgMarginPct)}</p>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-100">Top esdeveniments per marge</h2>
              <div className="mt-3 space-y-2">
                {report.topProfitability.length === 0 ? (
                  <p className="text-sm text-slate-400">Encara no hi ha esdeveniments completats.</p>
                ) : (
                  report.topProfitability.slice(0, 12).map((row) => (
                    <Link
                      key={row.id}
                      href={`/admin/bookings/${row.id}`}
                      className="block rounded-lg border border-white/10 p-3 hover:bg-white/5"
                    >
                      <p className="text-sm font-semibold text-slate-100">
                        {row.reference} · {row.clientName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(row.eventDate).toLocaleDateString('ca-ES')} · {row.source}
                      </p>
                      <p className="mt-1 text-xs text-emerald-300">
                        Marge {money(row.netMargin)} ({pct(row.marginPct)})
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-100">Esdeveniments en risc</h2>
              <div className="mt-3 space-y-2">
                {report.riskProfitability.length === 0 ? (
                  <p className="text-sm text-slate-400">Sense alertes de marge.</p>
                ) : (
                  report.riskProfitability.slice(0, 12).map((row) => (
                    <Link
                      key={row.id}
                      href={`/admin/bookings/${row.id}`}
                      className="block rounded-lg border border-white/10 p-3 hover:bg-white/5"
                    >
                      <p className="text-sm font-semibold text-slate-100">
                        {row.reference} · {row.clientName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(row.eventDate).toLocaleDateString('ca-ES')} · {row.source}
                      </p>
                      <p className="mt-1 text-xs text-rose-700">
                        Marge {money(row.netMargin)} ({pct(row.marginPct)})
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100">Rendibilitat per canal</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-400">
                    <th className="py-2">Canal</th>
                    <th className="py-2">Esdeveniments</th>
                    <th className="py-2">Ingressos</th>
                    <th className="py-2">Marge net</th>
                    <th className="py-2">Marge %</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bySource.map((row) => (
                    <tr key={row.source} className="border-b border-white/10">
                      <td className="py-2 font-medium text-slate-200">{row.source}</td>
                      <td className="py-2 text-slate-200">{row.bookings}</td>
                      <td className="py-2 text-slate-200">{money(row.revenue)}</td>
                      <td className="py-2 text-slate-200">{money(row.netMargin)}</td>
                      <td className="py-2 text-slate-200">{pct(row.avgMarginPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ProfitabilityConfigEditor initial={report.config} />
        </>
      )}

      {!report && (
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100">Configuració de rendibilitat</h2>
          <p className="mt-1 text-sm text-slate-400">
            Ajusta costos i marges encara que no hi hagi dades carregades.
          </p>
          <div className="mt-3">
            <ProfitabilityConfigEditor initial={normalizeProfitabilityConfig(null)} />
          </div>
        </section>
      )}

      <ProfitabilityConfigHistory entries={historyEntries} />
    </div>
  );
}





