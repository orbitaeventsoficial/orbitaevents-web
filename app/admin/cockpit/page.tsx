import { AdminPage } from '../components/AdminPage';
import { buildEconomicCockpit } from '@/lib/services/economicCockpitService';
import { formatCurrency, formatMonthYearCompact } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cockpit Econòmic | Òrbita Admin',
};

// Zenit econòmic: una lectura de comandament — quant tinc compromès, quant és
// probable (ponderat) i quina és la previsió combinada per mes. Font única:
// buildEconomicCockpit (unifica pipeline ponderat + cash-flow). Visual provisional
// (tokens canònics) — pendent de la passada visual del propietari.
export default async function CockpitPage() {
  const cockpit = await buildEconomicCockpit(6).catch(() => null);

  if (!cockpit) {
    return (
      <AdminPage title="Cockpit Econòmic" subtitle="Previsió d'ingressos i marge dels propers mesos.">
        <div className="ap-card ap-card-body">No s&apos;ha pogut carregar la previsió.</div>
      </AdminPage>
    );
  }

  const { summary, months } = cockpit;
  const maxBar = Math.max(1, ...months.map((m) => Math.max(m.committedRevenue, m.weightedPipeline)));

  return (
    <AdminPage
      title="Cockpit Econòmic"
      subtitle={`Previsió dels propers ${summary.monthsAhead} mesos — compromès, ponderat i combinat.`}
    >
      <section className="ap-kpi-row">
        <div className="ap-kpi ap-kpi--success">
          <p className="ap-kpi-label">Compromès</p>
          <p className="ap-kpi-value">{formatCurrency(summary.committedTotal)}</p>
          <p className="ap-kpi-trend">Reserves ja confirmades</p>
        </div>
        <div className="ap-kpi ap-kpi--info">
          <p className="ap-kpi-label">Ponderat (probable)</p>
          <p className="ap-kpi-value">{formatCurrency(summary.weightedTotal)}</p>
          <p className="ap-kpi-trend">Pipeline × probabilitat</p>
        </div>
        <div className="ap-kpi">
          <p className="ap-kpi-label">Previsió combinada</p>
          <p className="ap-kpi-value">{formatCurrency(summary.combinedTotal)}</p>
          <p className="ap-kpi-trend">Pipeline + històric</p>
        </div>
        <div className="ap-kpi">
          <p className="ap-kpi-label">Variació interanual</p>
          <p className="ap-kpi-value">{summary.yoyDeltaPct === null ? '—' : `${summary.yoyDeltaPct > 0 ? '+' : ''}${summary.yoyDeltaPct}%`}</p>
          <p className="ap-kpi-trend">vs mateix període any anterior</p>
        </div>
      </section>

      <section className="ap-card">
        <div className="ap-card-body">
          <h2 className="text-sm font-semibold mb-3">Per mes</h2>
          <div className="space-y-3">
            {months.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium opacity-70">{formatMonthYearCompact(m.month)}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-4 rounded admin-tone-bg-neutral overflow-hidden flex">
                    <div className="h-full admin-tone-bg-success" style={{ width: `${(m.committedRevenue / maxBar) * 100}%` }} title="Compromès" />
                    <div className="h-full admin-tone-bg-info" style={{ width: `${(m.weightedPipeline / maxBar) * 100}%` }} title="Ponderat" />
                  </div>
                </div>
                <span className="w-24 shrink-0 text-right text-xs font-semibold">{formatCurrency(m.committedRevenue + m.weightedPipeline)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs opacity-50">
            Verd: compromès (reserves confirmades) · Blau: ponderat (pipeline × probabilitat).
          </p>
        </div>
      </section>
    </AdminPage>
  );
}
