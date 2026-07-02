import { DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM, calculateTravelCost, sanitizeNonNegative } from '@/lib/services/travelCost';

export const TRAVEL_DRIVER_HOURLY_RATE = 18;
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
    driverCost: round2(driverCost),
    passengerCost: round2(passengerCost),
    peopleCost,
    totalCost: round2(vehicleCost + peopleCost),
    lines,
  };
}
