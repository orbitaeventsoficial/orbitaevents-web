import './cockpit.css';
import { AdminPage } from '../components/AdminPage';
import { buildEconomicCockpit } from '@/lib/services/economicCockpitService';
import { formatCurrency, formatMonthYearCompact } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cockpit Econòmic | Òrbita Admin',
};

// Zenit econòmic. Tesi: la tresoreria futura del negoci d'un cop d'ull —
// quant està compromès (segur), quant és probable (pipeline ponderat) i com va
// la previsió respecte l'any passat. Font única: buildEconomicCockpit.
export default async function CockpitPage() {
  const cockpit = await buildEconomicCockpit(6).catch(() => null);

  if (!cockpit) {
    return (
      <AdminPage title="Cockpit Econòmic" subtitle="Previsió d'ingressos dels propers mesos.">
        <div className="ap-card ap-card-body">No s&apos;ha pogut carregar la previsió ara mateix. Torna-ho a provar.</div>
      </AdminPage>
    );
  }

  const { summary, months } = cockpit;
  const yoy = summary.yoyDeltaPct;
  const yoyClass = yoy === null ? '' : yoy >= 0 ? 'ck__yoy--up' : 'ck__yoy--down';
  const maxMonth = Math.max(1, ...months.map((m) => m.committedRevenue + m.weightedPipeline));

  return (
    <AdminPage
      title="Cockpit Econòmic"
      subtitle="La salut econòmica dels propers sis mesos, en una lectura."
    >
      <div className="ck">
        {/* HERO — el número-tesi: tresoreria prevista del període */}
        <section className="ck__hero" aria-label="Previsió del període">
          <p className="ck__eyebrow">Tresoreria · pròxims {summary.monthsAhead} mesos</p>
          <div className="ck__herorow">
            <p className="ck__heronum">{formatCurrency(summary.combinedTotal)}</p>
            {yoy !== null && (
              <span className={`ck__yoy ${yoyClass}`} title="Variació de la previsió respecte el mateix període de l'any anterior">
                {yoy >= 0 ? '▲' : '▼'} {Math.abs(yoy)}%
                <span className="ck__yoy-label">vs any passat</span>
              </span>
            )}
          </div>
          <p className="ck__herocap">Previsió combinada — pipeline ponderat més la mitjana històrica del mes.</p>
        </section>

        {/* PILARS — jerarquia de certesa de l'ingrés */}
        <section className="ck__pillars" aria-label="Composició de la previsió">
          <article className="ck__pillar ck__pillar--committed">
            <span className="ck__pillar-dot" aria-hidden="true" />
            <p className="ck__pillar-label">Compromès</p>
            <p className="ck__pillar-val">{formatCurrency(summary.committedTotal)}</p>
            <p className="ck__pillar-cap">Reserves ja confirmades</p>
          </article>
          <article className="ck__pillar ck__pillar--weighted">
            <span className="ck__pillar-dot" aria-hidden="true" />
            <p className="ck__pillar-label">Probable</p>
            <p className="ck__pillar-val">{formatCurrency(summary.weightedTotal)}</p>
            <p className="ck__pillar-cap">Pipeline × probabilitat de tancament</p>
          </article>
          <article className="ck__pillar ck__pillar--net">
            <span className="ck__pillar-dot" aria-hidden="true" />
            <p className="ck__pillar-label">Marge previst</p>
            <p className="ck__pillar-val">{formatCurrency(summary.netForecastTotal)}</p>
            <p className="ck__pillar-cap">
              {summary.netMarginPct === null ? 'Benefici net estimat' : `${summary.netMarginPct}% sobre la previsió`}
            </p>
          </article>
          <article className="ck__pillar">
            <p className="ck__pillar-label">Històric</p>
            <p className="ck__pillar-val">{formatCurrency(summary.previousYearTotal)}</p>
            <p className="ck__pillar-cap">Mateix període, any anterior</p>
          </article>
        </section>

        {/* SIGNATURA — escala temporal: certesa de l'ingrés mes a mes */}
        <section className="ck__timeline" aria-label="Previsió mes a mes">
          <header className="ck__tl-head">
            <h2 className="ck__tl-title">Mes a mes</h2>
            <div className="ck__legend">
              <span className="ck__legend-item"><span className="ck__legend-swatch ck__legend-swatch--committed" /> Compromès</span>
              <span className="ck__legend-item"><span className="ck__legend-swatch ck__legend-swatch--weighted" /> Probable</span>
            </div>
          </header>

          {months.every((m) => m.committedRevenue + m.weightedPipeline === 0) ? (
            <p className="ck__empty">Encara no hi ha reserves confirmades ni pipeline obert amb valor per a aquests mesos. Quan entrin leads amb pressupost, la previsió apareixerà aquí.</p>
          ) : (
            <ul className="ck__rows">
              {months.map((m) => {
                const committedPct = (m.committedRevenue / maxMonth) * 100;
                const weightedPct = (m.weightedPipeline / maxMonth) * 100;
                return (
                  <li key={m.month} className="ck__row">
                    <span className="ck__row-month">{formatMonthYearCompact(m.month)}</span>
                    <span className="ck__row-track">
                      <span className="ck__row-committed" style={{ width: `${committedPct}%` }} />
                      <span className="ck__row-weighted" style={{ width: `${weightedPct}%` }} />
                    </span>
                    <span className="ck__row-total">{formatCurrency(m.committedRevenue + m.weightedPipeline)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminPage>
  );
}
