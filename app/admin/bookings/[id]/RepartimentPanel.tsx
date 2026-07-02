import { REPARTIMENT_OWNER_KEY, type BoloRepartiment } from '@/lib/services/repartimentService';
import { formatCurrency } from '@/lib/constants';

/**
 * Panell «Repartiment del bolo» de la fitxa de RESERVA (liquidació real, #1355).
 * Projecta `computeBoloRepartiment` (font única, solidària amb lead i cuadrant):
 * qui cobra què element a element + agregat per persona. Presentacional (0 lògica
 * de diners aquí; tot ve del motor).
 */
export default function RepartimentPanel({
  repartiment,
  names,
}: {
  repartiment: BoloRepartiment;
  names: Record<string, string>;
}) {
  const nameOf = (id: string) => (id === REPARTIMENT_OWNER_KEY ? 'Òrbita' : names[id] ?? 'Col·laborador');
  const { elements, perPersona, totals } = repartiment;

  return (
    <div className="ap-rep">
      {/* Agregat per persona */}
      <div className="ap-rep-people">
        {perPersona.map((p) => (
          <div key={p.personId} className="ap-rep-person" data-owner={p.esOrbita ? 'true' : undefined}>
            <span className="ap-rep-person-name">{nameOf(p.personId)}{p.esOrbita ? ' (tu)' : ''}</span>
            <strong className="ap-rep-person-amount">{formatCurrency(p.rep)}</strong>
            <span className="ap-rep-person-sub">{p.linies} {p.linies === 1 ? 'línia' : 'línies'}</span>
          </div>
        ))}
      </div>

      {/* Detall element a element */}
      <div className="ap-rep-table" role="table" aria-label="Repartiment element a element">
        <div className="ap-rep-row ap-rep-row--head" role="row">
          <span role="columnheader">Element</span>
          <span role="columnheader">Client paga</span>
          <span role="columnheader">Qui cobra</span>
          <span role="columnheader">Cobra</span>
          <span role="columnheader">Marge Òrbita</span>
        </div>
        {elements.map((e, i) => (
          <div key={i} className="ap-rep-row" role="row">
            <span className="ap-rep-cell-label" role="cell">{e.label || '—'}</span>
            <span role="cell">{formatCurrency(e.clientPaga)}</span>
            <span role="cell" data-owner={e.esOrbita ? 'true' : undefined}>{nameOf(e.beneficiariId)}</span>
            <span role="cell">{e.esOrbita ? '—' : formatCurrency(e.cobra)}</span>
            <span role="cell" className="ap-rep-cell-marge">{formatCurrency(e.margeOrbita)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="ap-rep-totals">
        <div><span>Client paga</span><strong>{formatCurrency(totals.clientTotal)}</strong></div>
        <div><span>A col·laboradors</span><strong>{formatCurrency(totals.aCollaboradors)}</strong></div>
        <div className="ap-rep-totals--orbita"><span>Part Òrbita</span><strong>{formatCurrency(totals.partOrbita)}</strong></div>
      </div>
    </div>
  );
}
