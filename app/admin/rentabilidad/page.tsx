import Link from 'next/link';
import { buildProfitabilityReport, normalizeProfitabilityConfig } from '@/lib/services/profitabilityService';
import { prisma } from '@/lib/prisma';
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
  const report = await buildProfitabilityReport();
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
      <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Rentabilidad ejecutiva</h1>
        <p className="mt-1 text-sm text-slate-500">
          Margen por evento, riesgo y retorno por canal comercial.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/api/admin/reports/profitability"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Exportar JSON
          </a>
          <Link
            href="/admin/sales-ops"
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ir a Sales Ops
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Ingresos realizados</p>
          <p className="text-2xl font-semibold text-slate-800">{money(report.realized.revenue)}</p>
          <p className="text-xs text-slate-500">{report.realized.bookings} eventos completados</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs text-emerald-700">Margen neto realizado</p>
          <p className="text-2xl font-semibold text-emerald-700">{money(report.realized.netMargin)}</p>
          <p className="text-xs text-emerald-700">Margen medio {pct(report.realized.avgMarginPct)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Forecast ingresos</p>
          <p className="text-2xl font-semibold text-slate-800">{money(report.forecast.revenue)}</p>
          <p className="text-xs text-slate-500">{report.forecast.bookings} eventos en pipeline</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs text-amber-700">Forecast margen</p>
          <p className="text-2xl font-semibold text-amber-700">{money(report.forecast.netMargin)}</p>
          <p className="text-xs text-amber-700">Margen medio {pct(report.forecast.avgMarginPct)}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Top eventos por margen</h2>
          <div className="mt-3 space-y-2">
            {report.topProfitability.length === 0 ? (
              <p className="text-sm text-slate-500">Sin eventos completados todavía.</p>
            ) : (
              report.topProfitability.slice(0, 12).map((row) => (
                <Link
                  key={row.id}
                  href={`/admin/bookings/${row.id}`}
                  className="block rounded-lg border border-stone-200 p-3 hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {row.reference} · {row.clientName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(row.eventDate).toLocaleDateString('ca-ES')} · {row.source}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Margen {money(row.netMargin)} ({pct(row.marginPct)})
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Eventos en riesgo</h2>
          <div className="mt-3 space-y-2">
            {report.riskProfitability.length === 0 ? (
              <p className="text-sm text-slate-500">Sin alertas de margen.</p>
            ) : (
              report.riskProfitability.slice(0, 12).map((row) => (
                <Link
                  key={row.id}
                  href={`/admin/bookings/${row.id}`}
                  className="block rounded-lg border border-stone-200 p-3 hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {row.reference} · {row.clientName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(row.eventDate).toLocaleDateString('ca-ES')} · {row.source}
                  </p>
                  <p className="mt-1 text-xs text-rose-700">
                    Margen {money(row.netMargin)} ({pct(row.marginPct)})
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Rentabilidad por canal</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2">Canal</th>
                <th className="py-2">Eventos</th>
                <th className="py-2">Ingresos</th>
                <th className="py-2">Margen neto</th>
                <th className="py-2">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {report.bySource.map((row) => (
                <tr key={row.source} className="border-b border-stone-100">
                  <td className="py-2 font-medium text-slate-700">{row.source}</td>
                  <td className="py-2 text-slate-700">{row.bookings}</td>
                  <td className="py-2 text-slate-700">{money(row.revenue)}</td>
                  <td className="py-2 text-slate-700">{money(row.netMargin)}</td>
                  <td className="py-2 text-slate-700">{pct(row.avgMarginPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ProfitabilityConfigEditor initial={report.config} />
      <ProfitabilityConfigHistory entries={historyEntries} />
    </div>
  );
}
