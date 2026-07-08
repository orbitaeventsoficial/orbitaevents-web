import { DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM, calculateTravelCost, sanitizeNonNegative } from '@/lib/services/travelCost';

// Tarifa del temps de carretera (decisió del propietari #1363): tothom a 15 €/h, tant qui
// condueix com qui va de passatger. La gent consumeix HORES (no km). Filosofia del propietari
// (#1386): el transport és COST NEUTRE — ni marge ni pèrdua. El client paga el que costa i
// prou; el benefici d'Òrbita viu al PRODUCTE (DJ propi, revenda), no al volant.
export const TRAVEL_DRIVER_HOURLY_RATE = 15;
export const TRAVEL_PASSENGER_HOURLY_RATE = 15;
// Dieta de desplaçament (#1386, decisió del propietari): en rutes llargues (que obliguen a
// menjar fora / cremen el dia), cada PERSONA que viatja cobra una dieta d'àpat. És cost real
// repercutit al client (break-even, no marge): cobreix el treballador —o tu— quan el bolo és
// lluny. Els bolos locals (ruta per sota del llindar) NO en tenen. Monocapa: es canvia AQUÍ i
// val a totes les superfícies (lead, reserva, portal, PDFs).
export const TRAVEL_MEAL_ALLOWANCE_PER_PERSON = 30;
// Llindar (hores de ruta anada+tornada) a partir del qual s'activa la dieta. ~3 h a/t = bolo
// que ja no és «tornar per dinar/sopar a casa».
export const TRAVEL_LONG_ROUTE_HOURS = 3;
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

/**
 * Dietes de ruta llarga com a línies de cost atribuïdes a qui viatja.
 * `computeBoloTransport` decideix SI hi ha dieta i l'import total; aquest helper només
 * reparteix aquell total entre les persones de la ruta perquè lead/reserva/repartiment
 * puguin mostrar qui cobra la dieta sense recalcular la regla.
 */
export function buildTravelMealAllowanceLines(
  people: TravelPersonInput[],
  mealAllowance: number,
): TravelCostLine[] {
  const totalPeople = (people || []).reduce((sum, person) => {
    const count = Math.max(1, Math.floor(sanitizeNonNegative(person.count ?? 1, 1)));
    return sum + count;
  }, 0);
  const total = round2(sanitizeNonNegative(mealAllowance, 0));
  if (total <= 0 || totalPeople <= 0) return [];

  const amountPerPerson = round2(total / totalPeople);
  return (people || []).map((person) => {
    const count = Math.max(1, Math.floor(sanitizeNonNegative(person.count ?? 1, 1)));
    const amount = round2(amountPerPerson * count);
    const label = person.label?.trim() || 'Equip ruta';
    return {
      label: `Dieta desplaçament · ${label}${count > 1 ? ` x${count}` : ''}`,
      costAmount: amount,
      collaboratorId: person.collaboratorId || null,
      notes: `${TRAVEL_COST_LINE_MARKER} dieta · ${amountPerPerson.toFixed(2)} EUR/persona`,
    };
  });
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
 * Marge del transport al client (#1369). BREAK-EVEN = 1 (el client paga exactament el
 * cost). Aquesta és l'ÚNICA palanca per fer que el desplaçament deixi marge: posar-la a
 * 1.15 = +15%, etc. Es canvia AQUÍ i s'aplica a TOTES les superfícies (monocapa).
 */
export const CLIENT_TRAVEL_MARGIN = 1;

export interface BoloTransportResult {
  roundTripKm: number;
  headcount: number;
  tollsEur: number;
  routeHours: number;
  chargeableHours: number;
  cost: number;         // cost real total (cotxe + temps tripulació@15 + dieta + peatges)
  clientCharge: number; // el que paga el client (cotxe amb franquícia + tripulació + dieta + peatges)
  mealAllowance: number; // dieta de desplaçament (30 €/persona en rutes llargues; 0 si local)
  breakdown: TravelCostBreakdown;
}

/**
 * FONT ÚNICA del transport d'un bolo (#1369, monocapa). QUALSEVOL superfície que
 * necessiti el transport —lead, reserva, portal, PDFs, pricing— ha de cridar NOMÉS
 * aquesta funció i llegir-ne el resultat (`clientCharge`, `cost`, `breakdown`,
 * `headcount`, `chargeableHours`). Prohibit recalcular charge/cost/headcount pel seu
 * compte. Deriva el headcount de les línies del bolo (regla de persones físiques) i
 * calcula el cost real de dues potes (cotxe €/km + tripulació €/h) + peatges.
 */
export function computeBoloTransport(input: {
  roundTripKm: number | null;
  serviceLines?: TravelHeadcountLineLike[];
  hasOrbitaPack?: boolean;
  headcountOverride?: number | null;
  tollsEur?: number | null;
  vehicleCostPerKm?: number | null;
}): BoloTransportResult {
  const km = round2(sanitizeNonNegative(input.roundTripKm, 0));
  const tolls = round2(sanitizeNonNegative(input.tollsEur, 0));
  const headcount = input.headcountOverride != null && input.headcountOverride >= 0
    ? Math.floor(input.headcountOverride)
    : deriveTravelHeadcount(input.serviceLines ?? [], input.hasOrbitaPack ?? false);
  const breakdown = calculateTravelCostBreakdown({
    roundTripKm: km,
    vehicleCostPerKm: input.vehicleCostPerKm,
    tollsEur: tolls,
    vehicleOwner: { label: '' },
    people: headcount > 0
      ? [
          { role: 'DRIVER', label: '' },
          ...(headcount > 1 ? [{ role: 'PASSENGER' as const, label: '', count: headcount - 1 }] : []),
        ]
      : [],
  });
  // Franquícia comercial (decisió del propietari): els primers INCLUDED_TRAVEL_KM (50 km
  // a/t = 25 anada + 25 tornada) de COTXE van inclosos al càrrec del client («desplaçament
  // inclòs fins a 25 km»). El COST intern real es manté sencer (la benzina es gasta igual)
  // → la franquícia és un gest comercial conscient, no un maquillatge del marge. El temps
  // de la tripulació ja té la seva pròpia franquícia (la 1a hora de ruta).
  const vehicleCostPerKm = sanitizeNonNegative(input.vehicleCostPerKm, DEFAULT_VEHICLE_COST_PER_KM);
  const billableKm = Math.max(0, km - INCLUDED_TRAVEL_KM);
  const clientVehicleCost = calculateTravelCost(billableKm, vehicleCostPerKm);
  // Dieta de desplaçament (#1386): en rutes llargues (routeHours > llindar) cada PERSONA que
  // viatja cobra una dieta d'àpat. Cost real repercutit al client (break-even): entra igual al
  // cost i al càrrec → NO mou el marge, cobreix el treballador quan el bolo és lluny. Els bolos
  // locals (sota el llindar) no en tenen. Font única del headcount = persones físiques.
  const mealAllowance = breakdown.routeHours > TRAVEL_LONG_ROUTE_HOURS
    ? round2(TRAVEL_MEAL_ALLOWANCE_PER_PERSON * headcount)
    : 0;
  const totalCost = km <= 0 ? round2(tolls + mealAllowance) : round2(breakdown.totalCost + mealAllowance);
  // El client paga el mateix cost real (transport = cost neutre): cotxe amb franquícia +
  // tripulació@15 + dieta + peatges. L'única franquícia comercial és la del cotxe (50 km).
  const clientCharge = km <= 0
    ? round2((tolls + mealAllowance) * CLIENT_TRAVEL_MARGIN)
    : round2((clientVehicleCost + breakdown.peopleCost + mealAllowance + tolls) * CLIENT_TRAVEL_MARGIN);
  return {
    roundTripKm: km,
    headcount,
    tollsEur: tolls,
    routeHours: breakdown.routeHours,
    chargeableHours: breakdown.chargeableHours,
    cost: totalCost,
    clientCharge,
    mealAllowance,
    breakdown,
  };
}

/**
 * @deprecated Usa `computeBoloTransport` (font única). Wrapper prim que en delega el
 * càrrec al client; es manté només mentre queden callers per migrar.
 */
export function calculateClientTravelCharge(
  roundTripKm: number,
  headcount: number,
  vehicleCostPerKm?: number | null,
  tollsEur?: number | null,
): number {
  return computeBoloTransport({
    roundTripKm, headcountOverride: headcount, vehicleCostPerKm, tollsEur,
  }).clientCharge;
}
