import { describe, it, expect } from 'vitest';
import { computeBookingFinancialSummary, computeSimpleMarginPct } from '@/lib/services/costEngine';
import { DEFAULT_PROFITABILITY_CONFIG } from '@/lib/services/profitabilityService';

describe('costEngine', () => {
  const config = DEFAULT_PROFITABILITY_CONFIG;

  describe('computeBookingFinancialSummary', () => {
    it('should compute summary with estimated pack cost (no inventory)', () => {
      const result = computeBookingFinancialSummary(
        {
          total: 1000,
          packPrice: 500,
          extrasTotal: 200,
          extraHours: 0,
          extraHourPrice: 0,
          distanceKm: 0,
          source: 'WEBSITE',
        },
        config,
      );

      expect(result.packCostIsReal).toBe(false);
      expect(result.packCost).toBe(500 * 0.36);
      expect(result.extrasCost).toBe(200 * 0.28);
      expect(result.fixedOperationalCost).toBe(45);
      expect(result.acquisitionCost).toBe(22); // WEBSITE CAC
      expect(result.total).toBe(1000);
      expect(result.directCost).toBeGreaterThan(0);
      expect(result.netMargin).toBeLessThan(1000);
    });

    it('should use real inventory cost when available', () => {
      const result = computeBookingFinancialSummary(
        {
          total: 1000,
          packPrice: 500,
          extrasTotal: 0,
          extraHours: 0,
          extraHourPrice: 0,
          distanceKm: 0,
          inventoryCostReal: 100,
        },
        config,
      );

      expect(result.packCostIsReal).toBe(true);
      expect(result.packCost).toBe(100);
    });

    it('should handle extra hours cost', () => {
      const result = computeBookingFinancialSummary(
        {
          total: 1500,
          packPrice: 800,
          extrasTotal: 0,
          extraHours: 2,
          extraHourPrice: 75,
          distanceKm: 0,
        },
        config,
      );

      expect(result.extraHoursCost).toBe(2 * 75 * 0.2);
    });

    it('should use explicit travelCost when provided', () => {
      const result = computeBookingFinancialSummary(
        {
          total: 1000,
          packPrice: 500,
          extrasTotal: 0,
          extraHours: 0,
          extraHourPrice: 0,
          distanceKm: 100,
          travelCost: 50,
        },
        config,
      );

      expect(result.travelCost).toBe(50);
    });

    it('should calculate travelCost from distanceKm when not explicit', () => {
      const result = computeBookingFinancialSummary(
        {
          total: 1000,
          packPrice: 500,
          extrasTotal: 0,
          extraHours: 0,
          extraHourPrice: 0,
          distanceKm: 100,
        },
        config,
      );

      expect(result.travelCost).toBe(100 * 0.19);
    });

    it('should return correct margin tone', () => {
      const highMargin = computeBookingFinancialSummary(
        { total: 2000, packPrice: 200, extrasTotal: 0, extraHours: 0, extraHourPrice: 0, distanceKm: 0 },
        config,
      );
      expect(highMargin.marginTone.tone).toBe('emerald');

      const lowMargin = computeBookingFinancialSummary(
        { total: 100, packPrice: 200, extrasTotal: 0, extraHours: 0, extraHourPrice: 0, distanceKm: 0 },
        config,
      );
      expect(lowMargin.marginTone.tone).toBe('rose');
    });

    it('should handle zero total gracefully', () => {
      const result = computeBookingFinancialSummary(
        { total: 0, packPrice: 0, extrasTotal: 0, extraHours: 0, extraHourPrice: 0, distanceKm: 0 },
        config,
      );
      expect(result.marginPct).toBe(0);
    });

    it('should use UNKNOWN CAC for unknown source', () => {
      const result = computeBookingFinancialSummary(
        { total: 1000, packPrice: 500, extrasTotal: 0, extraHours: 0, extraHourPrice: 0, distanceKm: 0, source: null },
        config,
      );
      expect(result.acquisitionCost).toBe(20); // UNKNOWN CAC
    });
  });

  describe('computeSimpleMarginPct', () => {
    it('should return margin percentage without CAC', () => {
      const pct = computeSimpleMarginPct(
        { total: 1000, packPrice: 500, extrasTotal: 0, extraHours: 0, extraHourPrice: 0, distanceKm: 0 },
        config,
      );
      // directCost = 500*0.36 + 0 + 0 + 45 + 0 = 225
      // margin = (1000 - 225) / 1000 * 100 = 77.5
      expect(pct).toBeCloseTo(77.5, 0);
    });

    it('should return 0 for zero total', () => {
      const pct = computeSimpleMarginPct(
        { total: 0, packPrice: 100, extrasTotal: 0, extraHours: 0, extraHourPrice: 0, distanceKm: 0 },
      );
      expect(pct).toBe(0);
    });
  });
});
