export const INCLUDED_TRAVEL_KM = 50;
export const DEFAULT_FUEL_COST_PER_KM = 0.19;
export const TRAVEL_BLOCK_KM = 40;
export const TRAVEL_BLOCK_EUR = 20;

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
  fuelCostPerKm: number,
  includedKm = INCLUDED_TRAVEL_KM,
): number {
  const billableKm = calculateBillableTravelKm(totalKm, includedKm);
  const rate = sanitizeNonNegative(fuelCostPerKm, DEFAULT_FUEL_COST_PER_KM);
  return round2(billableKm * rate);
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
