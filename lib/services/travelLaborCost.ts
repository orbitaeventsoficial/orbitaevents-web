import { DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM, calculateTravelCost, sanitizeNonNegative } from '@/lib/services/travelCost';

// Tarifa del temps de carretera (decisió del propietari #1363): tothom a 15 €/h,
// tant qui condueix com qui viatja de passatger. La gent consumeix HORES (no km).
export const TRAVEL_DRIVER_HOURLY_RATE = 15;
export const TRAVEL_PASSENGER_HOURLY_RATE = 15;
export const TRAVEL_AVG_SPEED_KMH = 65;
export const TRAVEL_COST_LINE_MARKER = '[travel-cost]';
// La primera hora de ruta (total anada+tornada) va INCLOSA EN EL PREU (no és gratis:
// forma part del preu base); els col·laboradors cobren les hores senceres completades
// per damunt. Decisió del propietari (2026-07-02): «la 1a hora va inclosa; les 2 h cobren 1 h».
export const TRAVEL_INCLUDED_HOURS = 1;

export type TravelPersonRole = 'DRIVER' | 'PASSENGER';

export type TravelPersonInput = {
  role: TravelPersonRole;
  label: string;
  collaboratorId?: string | null;
  count?: number | null;
};

export type TravelCostLine = {
  label: string;
  costAmount: number;
  collaboratorId: string | null;
  notes: string;
};

export type TravelCostBreakdown = {
  roundTripKm: number;
  routeHours: number;
  laborThresholdKm: number;
  includedHours: number;     // hores de ruta incloses en el preu (1a hora)
  chargeableHours: number;   // hores senceres que SÍ es cobren (excés per damunt de la inclosa)
  laborCostApplies: boolean;
  peopleCount: number;
  vehicleCost: number;
  tollsCost: number;
  driverCost: number;
  passengerCost: number;
  peopleCost: number;
  totalCost: number;
  lines: TravelCostLine[];
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateRoundTripHours(roundTripKm: number, speedKmh = TRAVEL_AVG_SPEED_KMH): number {
  const km = sanitizeNonNegative(roundTripKm, 0);
  const speed = Math.max(1, sanitizeNonNegative(speedKmh, TRAVEL_AVG_SPEED_KMH));
  return round2(km / speed);
}

function lineNotes(role: 'vehicle' | TravelPersonRole, hours: number, rate?: number): string {
  const rateText = typeof rate === 'number' ? ` · ${rate} EUR/h` : '';
  return `${TRAVEL_COST_LINE_MARKER} ${role} · ${hours.toFixed(2)} h${rateText}`;
}

export function calculateTravelCostBreakdown(input: {
  roundTripKm: number;
  vehicleCostPerKm?: number | null;
  routeHours?: number | null;
  laborThresholdKm?: number | null;
  vehicleOwner?: { label: string; collaboratorId?: string | null } | null;
  people?: TravelPersonInput[];
  tollsEur?: number | null;
}): TravelCostBreakdown {
  const roundTripKm = round2(sanitizeNonNegative(input.roundTripKm, 0));
  const routeHours = round2(
    input.routeHours != null
      ? sanitizeNonNegative(input.routeHours, 0)
      : estimateRoundTripHours(roundTripKm),
  );
  const vehicleCostPerKm = sanitizeNonNegative(input.vehicleCostPerKm, DEFAULT_VEHICLE_COST_PER_KM);
  const laborThresholdKm = sanitizeNonNegative(input.laborThresholdKm, INCLUDED_TRAVEL_KM);
  // La 1a hora (anada+tornada) va inclosa en el preu; l'excés es cobra en BLOCS DE 30 MIN,
  // arrodonint AMUNT (recomanació d'anàlisi econòmica: evita els esglaons injustos de l'hora
  // sencera — p. ex. 1h50 → 1 h, 2h30 → 1,5 h). 1,5 h → 0,5 h; 2 h → 1 h; 6,49 h → 5,5 h.
  const includedHours = TRAVEL_INCLUDED_HOURS;
  const chargeableHours = round2(Math.ceil(Math.max(0, routeHours - includedHours) / 0.5) * 0.5);
  const laborCostApplies = chargeableHours > 0;
  const vehicleCost = calculateTravelCost(roundTripKm, vehicleCostPerKm);
  const lines: TravelCostLine[] = [];

  if (vehicleCost > 0 && input.vehicleOwner) {
    lines.push({
      label: `Vehicle ruta · ${input.vehicleOwner.label}`,
      costAmount: vehicleCost,
      collaboratorId: input.vehicleOwner.collaboratorId || null,
      notes: `${TRAVEL_COST_LINE_MARKER} vehicle · ${roundTripKm.toFixed(1)} km · ${vehicleCostPerKm.toFixed(2)} EUR/km`,
    });
  }

  let driverCost = 0;
  let passengerCost = 0;
  let peopleCount = 0;
  for (const person of input.people || []) {
    const count = Math.max(1, Math.floor(sanitizeNonNegative(person.count ?? 1, 1)));
    peopleCount += count;
    if (!laborCostApplies) continue;
    const rate = person.role === 'DRIVER' ? TRAVEL_DRIVER_HOURLY_RATE : TRAVEL_PASSENGER_HOURLY_RATE;
    const cost = round2(chargeableHours * rate * count);
    if (cost <= 0) continue;
    if (person.role === 'DRIVER') driverCost += cost;
    else passengerCost += cost;
    lines.push({
      label: `${person.role === 'DRIVER' ? 'Temps ruta conductor' : 'Temps ruta passatger'} · ${person.label}${count > 1 ? ` x${count}` : ''}`,
      costAmount: cost,
      collaboratorId: person.collaboratorId || null,
      notes: lineNotes(person.role, chargeableHours, rate),
    });
  }

  // Peatges (#1364): cost real de la ruta que NO deriva dels km (depèn del recorregut).
  // Els paga qui posa el cotxe (vehicleOwner) → línia atribuïda a ell. Entra al cost i al càrrec.
  const tollsCost = round2(sanitizeNonNegative(input.tollsEur, 0));
  if (tollsCost > 0) {
    lines.push({
      label: `Peatges ruta · ${input.vehicleOwner?.label ?? 'Òrbita'}`,
      costAmount: tollsCost,
      collaboratorId: input.vehicleOwner?.collaboratorId || null,
      notes: `${TRAVEL_COST_LINE_MARKER} peatges`,
    });
  }

  const peopleCost = round2(driverCost + passengerCost);
  return {
    roundTripKm,
    routeHours,
    laborThresholdKm,
    includedHours,
    chargeableHours,
    laborCostApplies,
    peopleCount,
    vehicleCost,
    tollsCost,
    driverCost: round2(driverCost),
    passengerCost: round2(passengerCost),
    peopleCost,
    totalCost: round2(vehicleCost + tollsCost + peopleCost),
    lines,
  };
}

/** Línia mínima del bolo per derivar quanta gent viatja. */
export interface TravelHeadcountLineLike {
  kind?: string | null;
  label?: string | null;
  revenueAmount?: number | null;
  costAmount?: number | null;
  collaboratorId?: string | null;
  quantity?: number | null;
}

/**
 * Quantes PERSONES FÍSIQUES viatgen al bolo (#1363, regla del propietari). No se sumen
 * rols: es compten persones, i els rols que fa Òrbita (tu) COL·LAPSEN en 1 (una sola
 * persona viatjant). Font única del headcount → càrrec de transport coherent a tot arreu.
 *
 * Regla:
 * - Animador de Masquerade (`PROVIDER_SERVICE` amb `collaboratorId`) → +1 persona (seva).
 * - Tècnic de so INCLÒS del bingo (`SOUND_TECH` «inclòs»): el fa Masquerade (`costAmount ≥ 0`)
 *   → +1 persona (seva); el fas tu (`costAmount < 0`, Masquerade et paga) → ets TU.
 * - DJ (`kind DJ`, Òrbita) → ets TU.
 * - Tècnic de so EXTRA o assistenta (línia pròpia) → +1 persona cadascuna (separada).
 * - Tots els rols que fas TU (DJ + ser el tècnic del bingo) compten 1 sol cop.
 * Exemples: Bingo (tècnic Masq)=2 · Bingo (tècnic tu)=2 · DJ=1 · DJ+Bingo (tècnic Masq)=3 ·
 *           DJ+Bingo (tècnic tu)=2 (fas DJ i tècnic alhora).
 */
export function deriveTravelHeadcount(
  lines: TravelHeadcountLineLike[],
  hasOrbitaPack = false,
): number {
  let others = 0;              // persones que NO ets tu (animadors/tècnics de Masquerade, extres)
  let meTravels = hasOrbitaPack; // un pack d'Òrbita (DJ) el fas TU → viatges
  for (const l of lines) {
    const qty = Math.max(1, Math.floor(l.quantity || 1));
    const kind = l.kind;
    if (kind === 'DJ') {
      meTravels = true; // el DJ d'Òrbita ets tu
    } else if (kind === 'SOUND_TECH') {
      const isIncludedBingoTech = (l.label ?? '').startsWith('Tècnic de so inclòs');
      if (isIncludedBingoTech) {
        if ((l.costAmount ?? 0) < 0) meTravels = true; // el tècnic del bingo el fas tu
        else others += 1;                               // el tècnic el fa Masquerade
      } else {
        others += qty; // tècnic de so extra = persona separada
      }
    } else if (kind === 'PROVIDER_SERVICE' && l.collaboratorId) {
      others += qty; // animador presencial de Masquerade
    }
  }
  return others + (meTravels ? 1 : 0);
}

/**
 * CÀRREC de transport al CLIENT (#1363, decisió del propietari): el client paga el
 * COST REAL del desplaçament, amb les dues potes SEPARADES —cotxe per km + gent per
 * hores (1a hora inclosa)—. Substitueix la fórmula antiga per km (`calculateTravelCharge`,
 * 0,50 €/km) que només cobria el cotxe i ignorava el temps de la tripulació.
 * `headcount` = persones que viatgen (via `deriveTravelHeadcount`). Break-even amb el cost.
 */
export function calculateClientTravelCharge(
  roundTripKm: number,
  headcount: number,
  vehicleCostPerKm?: number | null,
  tollsEur?: number | null,
): number {
  const km = sanitizeNonNegative(roundTripKm, 0);
  const people = Math.max(0, Math.floor(sanitizeNonNegative(headcount, 0)));
  const tolls = round2(sanitizeNonNegative(tollsEur, 0));
  if (km <= 0) return tolls; // sense km però amb peatges (cas límit): el client els paga igualment
  const breakdown = calculateTravelCostBreakdown({
    roundTripKm: km,
    vehicleCostPerKm,
    tollsEur: tolls,
    vehicleOwner: { label: '' },
    people:
      people > 0
        ? [
            { role: 'DRIVER', label: '' },
            ...(people > 1 ? [{ role: 'PASSENGER' as const, label: '', count: people - 1 }] : []),
          ]
        : [],
  });
  return breakdown.totalCost;
}
