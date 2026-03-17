export const INCLUDED_TRAVEL_KM = 50;
export const DEFAULT_VEHICLE_COST_PER_KM = 0.19;
export const TRAVEL_BLOCK_KM = 40;
export const TRAVEL_BLOCK_EUR = 20;
export const DEFAULT_VEHICLE_CONSUMPTION_L100 = 8.5;
export const DEFAULT_MAINTENANCE_COST_PER_KM = 0.12;

export function getIncludedTravelOneWayKm(includedKm = INCLUDED_TRAVEL_KM): number {
  const safeIncluded = sanitizeNonNegative(includedKm, INCLUDED_TRAVEL_KM);
  return round2(safeIncluded / 2);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sanitizeNonNegative(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export function calculateBillableTravelKm(totalKm: number, includedKm = INCLUDED_TRAVEL_KM): number {
  const safeTotal = sanitizeNonNegative(totalKm, 0);
  const safeIncluded = sanitizeNonNegative(includedKm, INCLUDED_TRAVEL_KM);
  return round2(Math.max(0, safeTotal - safeIncluded));
}

export function calculateTravelBlocks(totalKm: number, includedKm = INCLUDED_TRAVEL_KM, blockKm = TRAVEL_BLOCK_KM): number {
  const billableKm = calculateBillableTravelKm(totalKm, includedKm);
  const safeBlockKm = Math.max(1, sanitizeNonNegative(blockKm, TRAVEL_BLOCK_KM));
  return billableKm <= 0 ? 0 : Math.ceil(billableKm / safeBlockKm);
}

export function calculateTravelCost(
  totalKm: number,
  vehicleCostPerKm: number,
  _includedKm = INCLUDED_TRAVEL_KM,
): number {
  const safeTotalKm = sanitizeNonNegative(totalKm, 0);
  const rate = sanitizeNonNegative(vehicleCostPerKm, DEFAULT_VEHICLE_COST_PER_KM);
  return round2(safeTotalKm * rate);
}

export function calculateTravelCharge(
  totalKm: number,
  includedKm = INCLUDED_TRAVEL_KM,
  blockKm = TRAVEL_BLOCK_KM,
  blockPrice = TRAVEL_BLOCK_EUR
): number {
  const blocks = calculateTravelBlocks(totalKm, includedKm, blockKm);
  return round2(blocks * sanitizeNonNegative(blockPrice, TRAVEL_BLOCK_EUR));
}

/**
 * Calcula el cost efectiu per km del vehicle a partir de:
 * - Preu combustible (€/litre) — idealment del MITECO via BD
 * - Consum del vehicle (L/100km)
 * - Cost de manteniment/amortització fix per km
 *
 * Fórmula: vehicleCostPerKm = (fuelPricePerLiter × consumL100 / 100) + maintenanceCostPerKm
 */
export function calculateEffectiveVehicleCostPerKm(
  fuelPricePerLiter: number,
  consumptionL100: number = DEFAULT_VEHICLE_CONSUMPTION_L100,
  maintenanceCostPerKm: number = DEFAULT_MAINTENANCE_COST_PER_KM,
): number {
  const safeFuel = sanitizeNonNegative(fuelPricePerLiter, 0);
  const safeConsumption = Math.max(0.1, sanitizeNonNegative(consumptionL100, DEFAULT_VEHICLE_CONSUMPTION_L100));
  const safeMaintenance = sanitizeNonNegative(maintenanceCostPerKm, DEFAULT_MAINTENANCE_COST_PER_KM);
  const fuelComponent = (safeFuel * safeConsumption) / 100;
  return round2(fuelComponent + safeMaintenance);
}

