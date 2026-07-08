'use client';

import { formatCurrency, formatNumber } from '@/lib/constants';

/**
 * Targeta «Desplaçament» del bolo (#1380, component compartit). FONT ÚNICA del disseny
 * del transport: la usen TANT la fitxa de lead com la de reserva (canon «un sol
 * dissenyador, hipersemblança» — un disseny, dues pàgines). Presentacional: rep valors
 * i callbacks, no té estat ni lògica de domini. Els números del transport surten del
 * cervell (`computeBoloTransport`); aquí només es mostren.
 *
 * ADAPTATIU (sense controls falsos — canon regla 8): els camps d'edició són OPCIONALS.
 *  · Lead = editor complet: passa override d'integrants, peatges i atribució (cotxe/condueix).
 *  · Reserva = vista avall: integrants en LECTURA, sense peatges ni atribució (heretat del lead).
 * Un camp només es renderitza editable si rep el seu handler; si no, es mostra el valor.
 */
/** Llindar de persones a partir del qual el transport «s'omple» → alarma vermella. Font única. */
export const CROWDED_TRIP_THRESHOLD = 2;

export interface RouteSettlementLine {
  label: string;
  amount: number;
  notes: string;
}

export interface RouteSummaryItem {
  label: string;
  amount: number;
}

export interface BoloTripCardProps {
  km: number;
  distanceKm: string;
  onDistanceChange: (value: string) => void;
  calculatingDistance?: boolean;
  /** Integrants derivats del cervell (placeholder de l'input auto / valor de lectura). */
  derivedHeadcount: number;
  /** Integrants efectius (per al badge i la lectura). */
  headcount: number;
  /** Override manual d'integrants (lead). Si no hi ha handler → lectura. */
  headcountOverride?: string;
  onHeadcountOverrideChange?: (value: string) => void;
  /** Peatges (lead). Si no hi ha handler → el camp no es mostra. */
  tollsEur?: string;
  onTollsChange?: (value: string) => void;
  /** Atribució de vehicle/conductor (lead). Si no hi ha col·laboradors → grup ocult. */
  travelCollaborators?: Array<{ id: string; name: string }>;
  vehicleOwnerId?: string;
  onVehicleOwnerChange?: (value: string) => void;
  driverId?: string;
  onDriverChange?: (value: string) => void;
  /** Hores de tripulació que es cobren (del breakdown del cervell). */
  chargeableHours: number;
  /** Més de 2 persones viatgen → alarma (el transport s'encareix). */
  tripCrowded: boolean;
  /** Cost real de la ruta (per al desplegable «qui cobra»). */
  effectiveTravelCost?: number;
  routeSettlementLines?: RouteSettlementLine[];
  routeSummaryItems?: RouteSummaryItem[];
  compactRouteSummary?: boolean;
  routeSummaryDensity?: 'items' | 'sentence';
  /** Notes de formula ja calculades pel pare; aquest component nomes les pinta. */
  calculationNotes?: string[];
  /** Els controls queden oberts a reserves; al lead es pot deixar plegat per reduir soroll. */
  controlsDefaultOpen?: boolean;
  /** Lead #1750: els ajustos de ruta han d'estar sempre visibles mentre es negocia el pacte. */
  controlsAlwaysVisible?: boolean;
}

export default function BoloTripCard({
  km,
  distanceKm,
  onDistanceChange,
  calculatingDistance = false,
  derivedHeadcount,
  headcount,
  headcountOverride,
  onHeadcountOverrideChange,
  tollsEur,
  onTollsChange,
  travelCollaborators = [],
  vehicleOwnerId = '',
  onVehicleOwnerChange,
  driverId = '',
  onDriverChange,
  chargeableHours,
  tripCrowded,
  effectiveTravelCost = 0,
  routeSettlementLines = [],
  routeSummaryItems = [],
  compactRouteSummary = false,
  routeSummaryDensity = 'items',
  calculationNotes = [],
  controlsDefaultOpen = true,
  controlsAlwaysVisible = false,
}: BoloTripCardProps) {
  const headcountEditable = typeof onHeadcountOverrideChange === 'function';
  const showTolls = typeof onTollsChange === 'function';
  const showAttribution = travelCollaborators.length > 0 && typeof onVehicleOwnerChange === 'function' && typeof onDriverChange === 'function';
  const hasRouteSettlement = effectiveTravelCost > 0 && routeSettlementLines.length > 0;
  const routeCompactConcepts = routeSummaryItems.map((item) => item.label.toLowerCase()).join(', ');

  return (
    <div className="ap-ledger-trip">
      <div className="ap-ledger-trip-head">
        <span className="ap-ledger-trip-title">Desplaçament</span>
        <span className="ap-ledger-trip-badge" data-alarm={tripCrowded ? 'true' : undefined}>
          {km > 0 ? `${km} km · ${headcount} ${headcount === 1 ? 'persona' : 'persones'}` : 'sense ruta'}
        </span>
      </div>
      {tripCrowded && (
        <p className="ap-ledger-trip-alarm" role="alert">
          ⚠ Viatgen {headcount} persones: el transport s'encareix molt (cada persona suma temps de tripulació). Revisa qui cal que hi vagi.
        </p>
      )}
      <p className="ap-ledger-trip-note">
        {chargeableHours > 0
          ? `La 1a hora de ruta va inclosa · es cobra el temps a partir d'aquí (${formatNumber(chargeableHours)} h de tripulació).`
          : 'Ruta curta: dins la 1a hora inclosa, no es cobra temps de tripulació.'}
      </p>
      <details
        className="ap-ledger-trip-controls"
        open={controlsDefaultOpen || controlsAlwaysVisible}
        data-always-visible={controlsAlwaysVisible ? 'true' : undefined}
        onToggle={controlsAlwaysVisible ? (event) => { event.currentTarget.open = true; } : undefined}
      >
        <summary className="ap-ledger-trip-controls-summary">
          <span>Ajustos de ruta</span>
          <strong>{showTolls && tollsEur ? `peatges ${tollsEur} €` : 'editar km, equip i peatges'}</strong>
        </summary>
        <div className="ap-ledger-trip-grid">
          <div className="ap-ledger-trip-group">
            <span className="ap-ledger-trip-grouplbl">Ruta</span>
            <div className="ap-ledger-trip-fields">
              <label className="ap-ledger-trip-field">
                <span>Km anada+tornada</span>
                <input
                  type="number" min={0} step={1} inputMode="numeric" className="adm-input"
                  value={distanceKm}
                  onChange={(e) => onDistanceChange(e.target.value)}
                  placeholder={calculatingDistance ? '…' : '0'}
                  aria-label="Km anada i tornada de la ruta"
                />
              </label>
              {headcountEditable ? (
                <label className="ap-ledger-trip-field">
                  <span>Integrants{headcountOverride ? '' : ' · auto'}</span>
                  <input
                    type="number" min={0} step={1} inputMode="numeric" className="adm-input"
                    data-alarm={tripCrowded ? 'true' : undefined}
                    value={headcountOverride}
                    onChange={(e) => onHeadcountOverrideChange!(e.target.value)}
                    placeholder={String(derivedHeadcount)}
                    aria-label="Integrants que viatgen (auto-calculat; escriu per ajustar)"
                    title="Es calcula sol des dels serveis del bolo. Escriu un número per ajustar-lo a mà."
                  />
                </label>
              ) : (
                <div className="ap-ledger-trip-field">
                  <span>Integrants</span>
                  <div className="ap-ledger-trip-ro" data-alarm={tripCrowded ? 'true' : undefined} aria-label={`${headcount} integrants que viatgen`}>
                    {headcount}
                  </div>
                </div>
              )}
              {showTolls && (
                <label className="ap-ledger-trip-field">
                  <span>Peatges</span>
                  <input
                    type="number" min={0} step="0.01" inputMode="decimal" className="adm-input"
                    value={tollsEur}
                    onChange={(e) => onTollsChange!(e.target.value)}
                    placeholder="0 €"
                    aria-label="Peatges de la ruta en euros"
                  />
                </label>
              )}
            </div>
          </div>
          {showAttribution && (
            <div className="ap-ledger-trip-group">
              <span className="ap-ledger-trip-grouplbl">Equip</span>
              <div className="ap-ledger-trip-fields">
                <label className="ap-ledger-trip-field">
                  <span>Posa el cotxe</span>
                  <select className="adm-input" value={vehicleOwnerId} onChange={(e) => onVehicleOwnerChange!(e.target.value)} aria-label="Qui posa el cotxe">
                    <option value="">Òrbita</option>
                    {travelCollaborators.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </label>
                <label className="ap-ledger-trip-field">
                  <span>Condueix</span>
                  <select className="adm-input" value={driverId} onChange={(e) => onDriverChange!(e.target.value)} aria-label="Qui condueix">
                    <option value="">Òrbita</option>
                    {travelCollaborators.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>
      </details>
      {calculationNotes.length > 0 && routeSettlementLines.length === 0 && (
        <div className="ap-ledger-trip-formula" aria-label="Càlcul del desplaçament">
          {calculationNotes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      )}

      {hasRouteSettlement && compactRouteSummary && (
        <div className="ap-ledger-route-compact" aria-label="Resum econòmic del transport">
          <div className="ap-ledger-route-compact-head">
            <span>Total ruta</span>
            <strong>{formatCurrency(effectiveTravelCost)}</strong>
          </div>
          <p>
            {routeSummaryDensity === 'sentence'
              ? `Inclou ${routeCompactConcepts || 'vehicle i equip'}. El detall de liquidació queda per reserva.`
              : chargeableHours > 0
                ? `${formatNumber(chargeableHours)} h facturables · ${routeCompactConcepts || 'ruta'}`
                : `Ruta curta · ${routeCompactConcepts || 'vehicle i equip'} dins la base`}
          </p>
          {routeSummaryDensity === 'items' && routeSummaryItems.length > 0 && (
            <div className="ap-ledger-route-compact-items">
              {routeSummaryItems.map((item) => (
                <span key={item.label}>
                  {item.label} <strong>{formatCurrency(item.amount)}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {hasRouteSettlement && !compactRouteSummary && (
        <details className="ap-ledger-route-settlement" aria-label="Repartiment econòmic del transport">
          <summary className="ap-ledger-route-settlement-head">
            <span>Qui cobra la ruta</span>
            <strong>{formatCurrency(effectiveTravelCost)}</strong>
          </summary>
          <div className="ap-ledger-route-settlement-grid">
            {calculationNotes.length > 0 && (
              <div className="ap-ledger-trip-formula ap-ledger-trip-formula--settlement" aria-label="Càlcul del desplaçament">
                {calculationNotes.map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </div>
            )}
            {routeSettlementLines.map((line, idx) => (
              <div key={`${line.label}-${idx}`} className="ap-ledger-route-settlement-row">
                <span>
                  {line.label}
                  <em>{line.notes}</em>
                </span>
                <strong>{formatCurrency(line.amount)}</strong>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
