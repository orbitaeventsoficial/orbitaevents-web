/* ============================================================================
   REPARTIMENT DEL BOLO — motor canònic únic (#1350+)
   ----------------------------------------------------------------------------
   «Qui cobra què» d'un bolo: partició dels diners del client entre Òrbita i els
   col·laboradors, element a element. FONT ÚNICA i SOLIDÀRIA: lead, reserva i
   cuadrant projecten aquest mateix càlcul (cap vista recalcula pel seu compte).

   Model (decisió del propietari): cost ABSOLUT en € per línia (sense comissió %).
   - Cada línia porta `revenueAmount` (el que paga el client), `costAmount` (el que
     cobra qui la fa) i `collaboratorId` (qui la fa; buit = Òrbita).
   - Un col·laborador rep el saldo net positiu de les seves línies. Si `costAmount`
     és negatiu en una línia amb `collaboratorId`, és una liquidació cap a Òrbita
     (ex.: el tècnic inclòs el posa Òrbita i el proveïdor el compensa).
   - Òrbita té dues magnituds separades:
     `brutOrbita = clientTotal − saldoTercers` i
     `partOrbita = brutOrbita − costosInternsOrbita`.
     Això evita confondre caixa bruta amb benefici real.
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
  sourceCollaboratorId?: string | null; // tercer original de la línia, també si liquida cap a Òrbita
  esOrbita: boolean;
  cobra: number;           // import que es queda/cobra el beneficiari visible de la línia
  cost: number;            // cost o liquidació visible en positiu
  costExtern: number;      // saldo signat del tercer (pot ser negatiu si liquida cap a Òrbita)
  costInternOrbita: number;// cost real assumit per Òrbita: operari, cotxe, dieta, peatges...
  liquidacioOrbita: number;// import que un tercer ha de compensar a Òrbita
  margeOrbita: number;     // impacte net d'aquesta línia sobre Òrbita
}

/** Agregat per persona (qui rep quant en total d'aquest bolo). */
export interface RepartimentPerson {
  personId: string;        // collaboratorId | REPARTIMENT_OWNER_KEY
  esOrbita: boolean;
  rep: number;             // tercers: saldo que cobren; Òrbita: benefici net conegut
  linies: number;          // nre. de línies que li corresponen
  brut?: number;           // només Òrbita: caixa bruta abans de costos interns
  costIntern?: number;     // només Òrbita: costos interns coneguts
}

export interface BoloRepartiment {
  elements: RepartimentElement[];
  perPersona: RepartimentPerson[];
  totals: {
    clientTotal: number;    // suma del que paga el client
    aCollaboradors: number; // saldo net dels tercers (pagaments - liquidacions cap a Òrbita)
    pagamentsCollaboradors: number; // suma positiva que s'ha de pagar a tercers
    liquidacionsCapAOrbita: number; // compensacions que tercers fan a Òrbita
    costInternOrbita: number; // costos interns coneguts d'Òrbita
    brutOrbita: number;     // clientTotal − aCollaboradors
    partOrbita: number;     // brutOrbita − costInternOrbita
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function nonNegativeMoney(value?: number | null): number {
  return round2(typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);
}

function positiveQuantity(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 1;
}

/**
 * Construeix la foto de repartiment completa d'un bolo quan hi ha transport.
 * La pàgina no ha de decidir com entra el desplaçament al "qui cobra què": afegeix
 * una línia d'ingrés `Transport client` i les línies de cost de ruta ja calculades
 * pel cervell de transport (vehicle, hores, peatges, dietes).
 */
export function buildBoloRepartimentLines(input: {
  serviceLines: RepartimentLine[];
  travelCharge?: number | null;
  travelCostLines?: RepartimentLine[];
}): RepartimentLine[] {
  const travelCharge = nonNegativeMoney(input.travelCharge);
  const travelCostLines = (input.travelCostLines ?? [])
    .filter((line) => nonNegativeMoney(line.costAmount) > 0)
    .map((line) => ({
      ...line,
      kind: line.kind ?? 'OTHER',
      revenueAmount: 0,
      quantity: line.quantity ?? 1,
    }));

  return [
    ...(input.serviceLines ?? []),
    ...(travelCharge > 0 ? [{
      label: 'Transport client',
      kind: 'OTHER',
      revenueAmount: travelCharge,
      costAmount: 0,
      quantity: 1,
      collaboratorId: null,
    }] : []),
    ...travelCostLines,
  ];
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
  let pagamentsCollaboradors = 0;
  let liquidacionsCapAOrbita = 0;
  let costInternOrbita = 0;
  let liniesOrbita = 0;

  for (const l of lines) {
    const qty = positiveQuantity(l.quantity);
    const clientPaga = round2((l.revenueAmount || 0) * qty);
    const signedCost = round2((l.costAmount || 0) * qty);
    const visibleCost = round2(Math.abs(signedCost));
    clientTotal = round2(clientTotal + clientPaga);

    if (l.collaboratorId) {
      aCollaboradors = round2(aCollaboradors + signedCost);
      if (signedCost > 0) pagamentsCollaboradors = round2(pagamentsCollaboradors + signedCost);
      if (signedCost < 0) liquidacionsCapAOrbita = round2(liquidacionsCapAOrbita + Math.abs(signedCost));
      const bucket = collab.get(l.collaboratorId) ?? { rep: 0, linies: 0 };
      bucket.rep = round2(bucket.rep + signedCost);
      bucket.linies += 1;
      collab.set(l.collaboratorId, bucket);

      const isLiquidacioCapAOrbita = signedCost < 0;
      if (isLiquidacioCapAOrbita) liniesOrbita += 1;
      elements.push({
        label: l.label || '', kind: l.kind || 'OTHER',
        clientPaga,
        beneficiariId: isLiquidacioCapAOrbita ? REPARTIMENT_OWNER_KEY : l.collaboratorId,
        sourceCollaboratorId: l.collaboratorId,
        esOrbita: isLiquidacioCapAOrbita,
        cobra: visibleCost,
        cost: visibleCost,
        costExtern: signedCost,
        costInternOrbita: 0,
        liquidacioOrbita: isLiquidacioCapAOrbita ? visibleCost : 0,
        margeOrbita: round2(clientPaga - signedCost),
      });
    } else {
      const ownCost = signedCost > 0 ? signedCost : 0;
      costInternOrbita = round2(costInternOrbita + ownCost);
      liniesOrbita += 1;
      elements.push({
        label: l.label || '', kind: l.kind || 'OTHER',
        clientPaga, beneficiariId: REPARTIMENT_OWNER_KEY, esOrbita: true,
        sourceCollaboratorId: null,
        cobra: clientPaga > 0 ? clientPaga : ownCost,
        cost: ownCost,
        costExtern: 0,
        costInternOrbita: ownCost,
        liquidacioOrbita: 0,
        margeOrbita: round2(clientPaga - ownCost),
      });
    }
  }

  const brutOrbita = round2(clientTotal - aCollaboradors);
  const partOrbita = round2(brutOrbita - costInternOrbita);
  const perPersona: RepartimentPerson[] = [
    {
      personId: REPARTIMENT_OWNER_KEY,
      esOrbita: true,
      rep: partOrbita,
      linies: liniesOrbita,
      brut: brutOrbita,
      costIntern: costInternOrbita,
    },
    ...[...collab.entries()]
      .map(([personId, b]) => ({ personId, esOrbita: false, rep: b.rep, linies: b.linies }))
      .sort((a, b) => b.rep - a.rep),
  ];

  return {
    elements,
    perPersona,
    totals: {
      clientTotal,
      aCollaboradors,
      pagamentsCollaboradors,
      liquidacionsCapAOrbita,
      costInternOrbita,
      brutOrbita,
      partOrbita,
    },
  };
}
