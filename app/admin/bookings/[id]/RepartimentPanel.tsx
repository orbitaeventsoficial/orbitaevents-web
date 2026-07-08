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
  mode = 'internal',
  detailsDefaultOpen = true,
  preproposalNotes = [],
}: {
  repartiment: BoloRepartiment;
  names: Record<string, string>;
  mode?: 'internal' | 'preproposal';
  detailsDefaultOpen?: boolean;
  preproposalNotes?: string[];
}) {
  const nameOf = (id: string) => (id === REPARTIMENT_OWNER_KEY ? 'Òrbita' : names[id] ?? 'Col·laborador');
  const { elements, perPersona, totals } = repartiment;
  const isPreproposal = mode === 'preproposal';
  const visiblePeople = isPreproposal ? perPersona.filter((p) => !p.esOrbita) : perPersona;
  const ownerMovementLabel = (label: string) => {
    if (label.startsWith('Temps ruta')) return 'Operari Òrbita';
    if (label.startsWith('Vehicle ruta')) return 'Vehicle Òrbita';
    if (label.startsWith('Peatges ruta')) return 'Vehicle Òrbita';
    if (label.startsWith('Dieta desplaçament')) return 'Dieta Òrbita';
    return 'Òrbita';
  };
  const payeeLabel = (e: BoloRepartiment['elements'][number]) => {
    if (!e.esOrbita) return nameOf(e.beneficiariId);
    if (e.costInternOrbita > 0 && e.clientPaga === 0) return ownerMovementLabel(e.label);
    return nameOf(e.beneficiariId);
  };
  const personSub = (p: BoloRepartiment['perPersona'][number]) => {
    if (!p.esOrbita) {
      const linesLabel = `${p.linies} ${p.linies === 1 ? 'línia' : 'línies'}`;
      return isPreproposal ? `import a validar · ${linesLabel}` : `saldo net · ${linesLabel}`;
    }
    if (isPreproposal) return `lectura interna · brut ${formatCurrency(p.brut ?? p.rep)} · cost intern ${formatCurrency(p.costIntern ?? 0)}`;
    return `benefici net · brut ${formatCurrency(p.brut ?? p.rep)} · cost intern ${formatCurrency(p.costIntern ?? 0)}`;
  };
  const costOrSettlement = (e: BoloRepartiment['elements'][number]) => {
    if (e.liquidacioOrbita > 0) return `+${formatCurrency(e.liquidacioOrbita)}`;
    return e.cost > 0 ? formatCurrency(e.cost) : '—';
  };
  const partnerRows = (personId: string) => elements
    .filter((e) => (e.beneficiariId === personId && !e.esOrbita) || (e.sourceCollaboratorId === personId && e.liquidacioOrbita > 0))
    .map((e) => ({
      key: `${personId}:${e.label}:${e.cobra}:${e.liquidacioOrbita}`,
      label: e.sourceCollaboratorId === personId && e.liquidacioOrbita > 0 ? `Compensació a Òrbita · ${e.label}` : e.label,
      amount: e.sourceCollaboratorId === personId && e.liquidacioOrbita > 0 ? e.liquidacioOrbita : e.cobra,
      meta: e.sourceCollaboratorId === personId && e.liquidacioOrbita > 0 ? 'es descompta del saldo pactat' : 'se li paga al partner',
      settlement: e.sourceCollaboratorId === personId && e.liquidacioOrbita > 0,
    }));

  return (
    <div className={`ap-rep${isPreproposal ? ' ap-rep--preproposal' : ''}`}>
      {isPreproposal && (
        <div className="ap-rep-purpose">
          <span>Lectura per pactar imports abans de crear dossier o pressupost.</span>
          <strong>Sense restar costos interns davant del partner.</strong>
        </div>
      )}

      {/* Agregat per persona */}
      <div className="ap-rep-people">
        {visiblePeople.map((p) => (
          <div key={p.personId} className="ap-rep-person" data-owner={p.esOrbita ? 'true' : undefined}>
            <span className="ap-rep-person-name">{nameOf(p.personId)}{p.esOrbita ? ' (tu)' : ''}</span>
            <strong className="ap-rep-person-amount">{formatCurrency(p.rep)}</strong>
            <span className="ap-rep-person-sub">{personSub(p)}</span>
          </div>
        ))}
      </div>

      {isPreproposal && visiblePeople.length > 0 && (
        <div className="ap-rep-partner">
          {preproposalNotes.length > 0 && (
            <div className="ap-rep-formula" aria-label="Càlcul de ruta per validar amb partner">
              {preproposalNotes.map((note) => <span key={note}>{note}</span>)}
            </div>
          )}
          {visiblePeople.map((p) => (
            <article key={`${p.personId}:detail`} className="ap-rep-partner-card">
              <div className="ap-rep-partner-head">
                <span>Detall a validar amb {nameOf(p.personId)}</span>
                <strong>{formatCurrency(p.rep)}</strong>
              </div>
              <div className="ap-rep-partner-lines">
                {partnerRows(p.personId).map((row) => (
                  <div key={row.key} className="ap-rep-partner-line" data-settlement={row.settlement ? 'true' : undefined}>
                    <span>{row.label}<em>{row.meta}</em></span>
                    <strong>{formatCurrency(row.amount)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detall element a element */}
      <details className="ap-rep-detail" open={detailsDefaultOpen}>
        <summary className="ap-rep-detail-summary">
          <span>{isPreproposal ? 'Detall intern de costos i ruta' : 'Detall element a element'}</span>
          <strong>{elements.length} línies</strong>
        </summary>
        <div className="ap-rep-detail-body">
          <div className="ap-rep-table" role="table" aria-label="Repartiment element a element">
            <div className="ap-rep-row ap-rep-row--head" role="row">
              <span role="columnheader">Element</span>
              <span role="columnheader">Client paga</span>
              <span role="columnheader">Cost/liquid.</span>
              <span role="columnheader">Qui cobra</span>
              <span role="columnheader">Import</span>
              <span role="columnheader">Net Òrbita</span>
            </div>
            {elements.map((e, i) => (
              <div key={i} className="ap-rep-row" role="row">
                <span className="ap-rep-cell-label" role="cell" data-label="Element">{e.label || '—'}</span>
                <span role="cell" data-label="Client paga">{formatCurrency(e.clientPaga)}</span>
                <span role="cell" data-label="Cost/liquid." className={e.liquidacioOrbita > 0 ? 'ap-rep-cell-liquidacio' : undefined}>{costOrSettlement(e)}</span>
                <span role="cell" data-label="Qui cobra" data-owner={e.esOrbita ? 'true' : undefined}>{payeeLabel(e)}</span>
                <span role="cell" data-label="Import">{e.cobra > 0 ? formatCurrency(e.cobra) : '—'}</span>
                <span role="cell" data-label="Net Òrbita" className="ap-rep-cell-marge">{formatCurrency(e.margeOrbita)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="ap-rep-totals">
            <div><span>Client paga</span><strong>{formatCurrency(totals.clientTotal)}</strong></div>
            <div><span>Pagaments tercers</span><strong>{formatCurrency(totals.pagamentsCollaboradors)}</strong></div>
            {totals.liquidacionsCapAOrbita > 0 && (
              <div><span>Liquidació a Òrbita</span><strong>{formatCurrency(totals.liquidacionsCapAOrbita)}</strong></div>
            )}
            <div><span>Brut Òrbita</span><strong>{formatCurrency(totals.brutOrbita)}</strong></div>
            <div><span>Cost intern Òrbita</span><strong>{formatCurrency(totals.costInternOrbita)}</strong></div>
            <div className="ap-rep-totals--orbita"><span>Benefici net Òrbita</span><strong>{formatCurrency(totals.partOrbita)}</strong></div>
          </div>
        </div>
      </details>
    </div>
  );
}
