/* ============================================================================
   REPARTIMENT DEL BOLO — motor canònic únic (#1350+)
   ----------------------------------------------------------------------------
   «Qui cobra què» d'un bolo: partició dels diners del client entre Òrbita i els
   col·laboradors, element a element. FONT ÚNICA i SOLIDÀRIA: lead, reserva i
   cuadrant projecten aquest mateix càlcul (cap vista recalcula pel seu compte).

   Model (decisió del propietari): cost ABSOLUT en € per línia (sense comissió %).
   - Cada línia porta `revenueAmount` (el que paga el client), `costAmount` (el que
     cobra qui la fa) i `collaboratorId` (qui la fa; buit = Òrbita).
   - Un col·laborador rep `costAmount × quantity` de les seves línies.
   - Òrbita rep la resta del que paga el client: `clientTotal − Σ(costos tercers)`.
     (El cost operatiu propi i el CAC són costos INTERNS d'Òrbita — no són repartiment;
      viuen a `computeBookingFinancialSummary` per al marge net real.)
   - El transport reparteix sol: les línies `[travel-cost]` porten el `collaboratorId`
     de qui posa el cotxe / condueix / viatja → el seu cost va a aquella persona.
============================================================================ */

export const REPARTIMENT_OWNER_KEY = '__orbita__';

/** Línia mínima per repartir (bolo del lead o de la reserva; mateixa forma). */
export interface RepartimentLine {
  label?: string | null;
  kind?: string | null;
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
  collaboratorId?: string | null;
}

/** Repartiment d'una línia concreta (detall element a element). */
export interface RepartimentElement {
  label: string;
  kind: string;
  clientPaga: number;      // revenueAmount × quantity
  beneficiariId: string;   // collaboratorId | REPARTIMENT_OWNER_KEY
  esOrbita: boolean;
  cobra: number;           // el que rep el beneficiari d'aquesta línia
  cost: number;            // costAmount × quantity (informatiu; útil quan clientPaga = 0)
  margeOrbita: number;     // clientPaga − cobra (marge de revenda d'Òrbita en aquesta línia)
}

/** Agregat per persona (qui rep quant en total d'aquest bolo). */
export interface RepartimentPerson {
  personId: string;        // collaboratorId | REPARTIMENT_OWNER_KEY
  esOrbita: boolean;
  rep: number;             // total que rep
  linies: number;          // nre. de línies que li corresponen
}

export interface BoloRepartiment {
  elements: RepartimentElement[];
  perPersona: RepartimentPerson[];
  totals: {
    clientTotal: number;    // suma del que paga el client
    aCollaboradors: number; // suma del que cobren els tercers
    partOrbita: number;     // clientTotal − aCollaboradors (part bruta d'Òrbita)
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Reparteix un bolo. Pura i determinista. La usen lead (estimació), reserva
 * (liquidació) i cuadrant (agregat) perquè el repartiment sigui SOLIDARI: canviar
 * qui fa una línia mou l'import a totes les vistes alhora, per construcció.
 */
export function computeBoloRepartiment(lines: RepartimentLine[]): BoloRepartiment {
  const elements: RepartimentElement[] = [];
  const collab = new Map<string, { rep: number; linies: number }>();
  let clientTotal = 0;
  let aCollaboradors = 0;

  for (const l of lines) {
    const qty = l.quantity || 1;
    const clientPaga = round2((l.revenueAmount || 0) * qty);
    const cost = round2((l.costAmount || 0) * qty);
    clientTotal = round2(clientTotal + clientPaga);

    if (l.collaboratorId) {
      aCollaboradors = round2(aCollaboradors + cost);
      const bucket = collab.get(l.collaboratorId) ?? { rep: 0, linies: 0 };
      bucket.rep = round2(bucket.rep + cost);
      bucket.linies += 1;
      collab.set(l.collaboratorId, bucket);
      elements.push({
        label: l.label || '', kind: l.kind || 'OTHER',
        clientPaga, beneficiariId: l.collaboratorId, esOrbita: false,
        cobra: cost, cost, margeOrbita: round2(clientPaga - cost),
      });
    } else {
      // Òrbita executa: es queda el PVP de la línia (la seva part d'aquesta peça).
      elements.push({
        label: l.label || '', kind: l.kind || 'OTHER',
        clientPaga, beneficiariId: REPARTIMENT_OWNER_KEY, esOrbita: true,
        cobra: clientPaga, cost, margeOrbita: clientPaga,
      });
    }
  }

  const partOrbita = round2(clientTotal - aCollaboradors);
  const perPersona: RepartimentPerson[] = [
    { personId: REPARTIMENT_OWNER_KEY, esOrbita: true, rep: partOrbita, linies: elements.filter((e) => e.esOrbita).length },
    ...[...collab.entries()]
      .map(([personId, b]) => ({ personId, esOrbita: false, rep: b.rep, linies: b.linies }))
      .sort((a, b) => b.rep - a.rep),
  ];

  return { elements, perPersona, totals: { clientTotal, aCollaboradors, partOrbita } };
}
