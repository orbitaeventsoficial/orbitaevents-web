import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveVehicleCostPerKm,
  DEFAULT_VEHICLE_CONSUMPTION_L100,
  DEFAULT_MAINTENANCE_COST_PER_KM,
} from '@/lib/services/travelCost';

describe('calculateEffectiveVehicleCostPerKm', () => {
  it('should calculate cost from fuel price + maintenance', () => {
    // 1.50 €/L × 8.5 L/100km / 100 = 0.1275 €/km fuel
    // + 0.12 €/km maintenance = 0.2475
    const result = calculateEffectiveVehicleCostPerKm(1.50, 8.5, 0.12);
    expect(result).toBeCloseTo(0.25, 1);
  });

  it('should use default consumption and maintenance when not provided', () => {
    const result = calculateEffectiveVehicleCostPerKm(1.50);
    // 1.50 × 8.5 / 100 + 0.12 = 0.2475
    const expected = (1.50 * DEFAULT_VEHICLE_CONSUMPTION_L100) / 100 + DEFAULT_MAINTENANCE_COST_PER_KM;
    expect(result).toBeCloseTo(expected, 2);
  });

  it('should handle zero fuel price', () => {
    const result = calculateEffectiveVehicleCostPerKm(0, 8.5, 0.12);
    expect(result).toBe(0.12); // Only maintenance
  });

  it('should handle negative fuel price gracefully', () => {
    const result = calculateEffectiveVehicleCostPerKm(-1, 8.5, 0.12);
    expect(result).toBe(0.12); // sanitized to 0
  });

  it('should handle high consumption vehicle', () => {
    // Furgoneta gran: 12 L/100km
    const result = calculateEffectiveVehicleCostPerKm(1.50, 12, 0.15);
    // 1.50 × 12 / 100 + 0.15 = 0.18 + 0.15 = 0.33
    expect(result).toBeCloseTo(0.33, 2);
  });

  it('should handle very low consumption (hybrid)', () => {
    const result = calculateEffectiveVehicleCostPerKm(1.50, 4, 0.08);
    // 1.50 × 4 / 100 + 0.08 = 0.06 + 0.08 = 0.14
    expect(result).toBeCloseTo(0.14, 2);
  });
});
