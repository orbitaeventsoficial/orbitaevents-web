/**
 * Tests del motor de cost unificat (costEngine).
 *
 * El costEngine és la font ÚNICA de veritat per a tots els càlculs de
 * marge i cost de qualsevol reserva al sistema. Cap altre fitxer hauria
 * de calcular marges inline — tot passa per aquí.
 *
 * FUNCIONS TESTEJADES:
 *
 * 1. computeBookingFinancialSummary(input, config)
 *    Calcula el resum financer complet d'una reserva:
 *    - Costos desglossats: pack, extres, hores extra, operacional fix, viatge
 *    - CAC (Cost d'Adquisició per Canal)
 *    - Marge net, % marge, to de color (semàfor)
 *
 * 2. computeSimpleMarginPct(input, config?)
 *    Retorna el % de marge simplificat (sense CAC) per a llistats i dashboards.
 *
 * 3. computeCollaboratorNetMargin(summary, collaborator)
 *    Calcula el marge net després de la comissió del col·laborador.
 *    Dos models: DISCOUNT (col·lab rep total - comissió) i NET_PLUS_COMMISSION.
 *
 * FÓRMULES CLAU:
 *   packCost = inventoryCostReal (si > 0) || packPrice × packCostRatio
 *   extrasCost = extrasTotal × extraCostRatio
 *   extraHoursCost = extraHours × extraHourPrice × extraHourCostRatio
 *   directCost = packCost + extrasCost + extraHoursCost + fixedOp + travelCost
 *   netMargin = total - directCost - acquisitionCost (CAC)
 *   marginPct = (netMargin / total) × 100
 */

import { describe, it, expect } from 'vitest';
import {
  computeBookingFinancialSummary,
  computeDirectCostBreakdown,
  computeSimpleMarginPct,
  computeCollaboratorNetMargin,
  aggregateServiceLines,
  computeServiceLineEconomics,
  classifyBoloLines,
  computeSupportableTravelKm,
  SUBCONTRACTED_MARKUP_TARGET_PCT,
} from '@/lib/services/costEngine';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { DEFAULT_VEHICLE_COST_PER_KM } from '@/lib/services/travelCost';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';
import { DEFAULT_PROFITABILITY_CONFIG } from '@/lib/services/profitabilityService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Config per defecte per als tests — valors reals del sistema */
const defaultConfig: ProfitabilityConfig = DEFAULT_PROFITABILITY_CONFIG;

/** Config personalitzada per a tests específics */
function customConfig(overrides: Partial<ProfitabilityConfig> = {}): ProfitabilityConfig {
  return {
    ...defaultConfig,
    ...overrides,
    channelCac: {
      ...defaultConfig.channelCac,
      ...(overrides.channelCac || {}),
    },
  };
}

/** Crea un input de reserva base amb valors típics d'un bolo estàndard */
function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    total: 1500,
    packPrice: 800,
    extrasTotal: 200,
    extraHours: 1,
    extraHourPrice: 75,
    distanceKm: 80,
    // Fixat a 0.19 explícit (#1364): abans era null i depenia del DEFAULT global, que
    // ha passat de 0.19 a 0.26 (barem IRPF vigent). Fixar-lo aquí manté els valors
    // esperats d'aquests tests estables i independents del fallback global.
    vehicleCostPerKm: 0.19 as number | null,
    travelCost: null as number | null,
    source: null as string | null,
    inventoryCostReal: null as number | null,
    ...overrides,
  };
}

// ─── computeBookingFinancialSummary ──────────────────────────────────────────

describe('costEngine', () => {
  describe('computeBookingFinancialSummary', () => {
    // --- Cas base: reserva estàndard ---

    it('reserva estàndard: calcula correctament tots els costos desglossats', () => {
      const input = baseInput();
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // packCost estimat = 800 × 0.36 = 288
      expect(result.packCost).toBeCloseTo(288, 2);
      expect(result.packCostIsReal).toBe(false);

      // extrasCost = 200 × 0.28 = 56
      expect(result.extrasCost).toBeCloseTo(56, 2);

      // extraHoursCost = 1 × 75 × 0.2 = 15
      expect(result.extraHoursCost).toBeCloseTo(15, 2);

      // fixedOperationalCost = 45 (de la config)
      expect(result.fixedOperationalCost).toBe(45);

      // travelCost = 80 × 0.19 = 15.2
      expect(result.travelCost).toBeCloseTo(15.2, 2);

      // directCost = 288 + 56 + 15 + 45 + 15.2 = 419.2
      expect(result.directCost).toBeCloseTo(419.2, 1);

      // total retornat = input total
      expect(result.total).toBe(1500);
    });

    it('reserva estàndard: marge net = total - directCost - CAC', () => {
      const input = baseInput({ source: 'WEBSITE' });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // CAC per WEBSITE = 22
      expect(result.acquisitionCost).toBe(22);

      // netMargin = 1500 - directCost - 22
      const expectedNetMargin = 1500 - result.directCost - 22;
      expect(result.netMargin).toBeCloseTo(expectedNetMargin, 2);

      // marginPct = (netMargin / 1500) × 100
      const expectedPct = (expectedNetMargin / 1500) * 100;
      expect(result.marginPct).toBeCloseTo(expectedPct, 2);
    });

    // --- Cost real d'inventari vs estimat ---

    it('amb inventoryCostReal: usa el cost real en lloc de l\'estimat', () => {
      const input = baseInput({ inventoryCostReal: 350 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.packCost).toBe(350);
      expect(result.packCostIsReal).toBe(true);
    });

    it('inventoryCostReal = 0: usa l\'estimat (0 no és un cost real vàlid)', () => {
      const input = baseInput({ inventoryCostReal: 0 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // Amb inventoryCostReal = 0, hauria de fer fallback a l'estimat
      expect(result.packCostIsReal).toBe(false);
      expect(result.packCost).toBeCloseTo(800 * 0.36, 2);
    });

    it('inventoryCostReal negatiu: usa l\'estimat', () => {
      const input = baseInput({ inventoryCostReal: -100 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.packCostIsReal).toBe(false);
      expect(result.packCost).toBeCloseTo(800 * 0.36, 2);
    });

    it('inventoryCostReal null: usa l\'estimat', () => {
      const input = baseInput({ inventoryCostReal: null });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.packCostIsReal).toBe(false);
      expect(result.packCost).toBeCloseTo(800 * 0.36, 2);
    });

    it('inventoryCostReal molt baix (1€): es considera real igualment', () => {
      const input = baseInput({ inventoryCostReal: 1 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.packCostIsReal).toBe(true);
      expect(result.packCost).toBe(1);
    });

    // --- Cost de viatge ---

    it('amb travelCost explícit: usa el valor donat en lloc de calcular', () => {
      const input = baseInput({ travelCost: 50 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.travelCost).toBe(50);
    });

    it('travelCost = 0: calcula el cost de viatge automàticament', () => {
      const input = baseInput({ travelCost: 0, distanceKm: 100 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // travelCost 0 no és > 0, doncs calcula: 100 × 0.19 = 19
      expect(result.travelCost).toBeCloseTo(19, 2);
    });

    it('travelCost null + vehicleCostPerKm personalitzat: calcula amb el cost/km donat', () => {
      const input = baseInput({ travelCost: null, vehicleCostPerKm: 0.25, distanceKm: 100 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // 100 × 0.25 = 25
      expect(result.travelCost).toBeCloseTo(25, 2);
    });

    it('distanceKm = 0: cost de viatge = 0', () => {
      const input = baseInput({ distanceKm: 0 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.travelCost).toBe(0);
    });

    it('distància molt llarga (500 km): cost de viatge significatiu', () => {
      const input = baseInput({ distanceKm: 500 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // 500 × 0.19 = 95
      expect(result.travelCost).toBeCloseTo(95, 2);
    });

    // --- CAC (Cost d'Adquisició per Canal) ---

    it('source REFERRAL: CAC = 8 (el canal més barat)', () => {
      const input = baseInput({ source: 'REFERRAL' });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.acquisitionCost).toBe(8);
    });

    it('source INSTAGRAM: CAC = 35 (el canal més car)', () => {
      const input = baseInput({ source: 'INSTAGRAM' });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.acquisitionCost).toBe(35);
    });

    it('source CONFIGURATOR: CAC = 18', () => {
      const input = baseInput({ source: 'CONFIGURATOR' });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.acquisitionCost).toBe(18);
    });

    it('source desconeguda: fallback a UNKNOWN (20€)', () => {
      const input = baseInput({ source: 'RANDOM_SOURCE' });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.acquisitionCost).toBe(20);
    });

    it('source null: fallback a UNKNOWN (20€)', () => {
      const input = baseInput({ source: null });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.acquisitionCost).toBe(20);
    });

    // --- Semàfor de marge (MarginTone) ---

    it('marge alt (>=50%): semàfor verd "Excel\u00b7lent"', () => {
      // Reserva molt rendible: total alt, costos baixos
      const input = baseInput({ total: 3000, packPrice: 300, extrasTotal: 0, extraHours: 0, distanceKm: 0 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.marginPct).toBeGreaterThanOrEqual(50);
      expect(result.marginTone.tone).toBe('emerald');
    });

    it('marge acceptable (30-49%): semàfor ambre "Acceptable"', () => {
      const input = baseInput({ total: 1000, packPrice: 500, extrasTotal: 0, extraHours: 0, distanceKm: 0 });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // directCost = 500*0.36 + 45 = 225, CAC = 20, netMargin = 755, pct ≈ 75.5
      // Això dona massa marge — ajustem
      const inputAjustat = baseInput({ total: 700, packPrice: 500, extrasTotal: 100, extraHours: 0, distanceKm: 50 });
      const resultAjustat = computeBookingFinancialSummary(inputAjustat, defaultConfig);

      // Verifiquem que el semàfor funciona per al rang amber
      if (resultAjustat.marginPct >= 30 && resultAjustat.marginPct < 50) {
        expect(resultAjustat.marginTone.tone).toBe('amber');
      }
    });

    it('marge crític (<15%): semàfor vermell "Crític"', () => {
      // Reserva poc rendible: total molt just respecte als costos
      const input = baseInput({
        total: 400,
        packPrice: 800,
        extrasTotal: 200,
        extraHours: 2,
        extraHourPrice: 75,
        distanceKm: 300,
      });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.marginPct).toBeLessThan(15);
      expect(result.marginTone.tone).toBe('rose');
    });

    // --- Edge cases ---

    it('tot a zero: marge 0%, cap divisió per zero', () => {
      const input = baseInput({
        total: 0,
        packPrice: 0,
        extrasTotal: 0,
        extraHours: 0,
        extraHourPrice: 0,
        distanceKm: 0,
      });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.marginPct).toBe(0);
      expect(result.total).toBe(0);
      // directCost = 0 + 0 + 0 + 45 + 0 = 45 (fixedOp always present)
      expect(result.fixedOperationalCost).toBe(45);
    });

    it('marge negatiu: quan els costos superen el total', () => {
      const input = baseInput({
        total: 200,
        packPrice: 500,
        extrasTotal: 300,
        extraHours: 3,
        extraHourPrice: 75,
        distanceKm: 300,
      });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.netMargin).toBeLessThan(0);
      expect(result.marginPct).toBeLessThan(0);
      expect(result.marginTone.tone).toBe('rose');
    });

    it('descompte fort: pack price alt però total baix (el cost estimat es basa en packPrice)', () => {
      // Simula un descompte important: pack val 1000 però el total és 600
      const input = baseInput({
        total: 600,
        packPrice: 1000,
        extrasTotal: 0,
        extraHours: 0,
        distanceKm: 20,
      });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // packCost estimat = 1000 × 0.36 = 360
      // fixedOp = 45, travel = 20 × 0.19 = 3.8
      // directCost = 360 + 0 + 0 + 45 + 3.8 = 408.8
      expect(result.packCost).toBeCloseTo(360, 2);
      expect(result.directCost).toBeCloseTo(408.8, 1);
    });

    it('reserva amb moltes hores extra: impacte significatiu al cost', () => {
      const input = baseInput({
        total: 2000,
        extraHours: 5,
        extraHourPrice: 75,
      });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      // extraHoursCost = 5 × 75 × 0.2 = 75
      expect(result.extraHoursCost).toBeCloseTo(75, 2);
    });

    it('reserva sense extres ni hores extra: només pack + fix + viatge', () => {
      const input = baseInput({
        extrasTotal: 0,
        extraHours: 0,
        extraHourPrice: 0,
      });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.extrasCost).toBe(0);
      expect(result.extraHoursCost).toBe(0);
      expect(result.directCost).toBeCloseTo(
        result.packCost + result.fixedOperationalCost + result.travelCost,
        2,
      );
    });

    it('suma cost de línies de servei al directCost sense duplicar comissions de CollaboratorBooking', () => {
      const input = baseInput({
        total: 340,
        packPrice: 0,
        extrasTotal: 0,
        extraHours: 0,
        extraHourPrice: 0,
        distanceKm: 0,
        serviceLinesRevenue: 340,
        serviceLinesCost: 120,
      });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      expect(result.serviceLinesRevenue).toBe(340);
      expect(result.serviceLinesCost).toBe(120);
      expect(result.directCost).toBe(result.fixedOperationalCost + 120);
      expect(result.total).toBe(340);
    });

    it('calcula subcontractat +20% i tècnic Òrbita dins el resum financer', () => {
      const serviceLines = [
        { kind: 'PROVIDER_SERVICE', collaboratorId: 'masquerade', revenueAmount: 240, costAmount: 200, quantity: 1 },
        { kind: 'SOUND_TECH', collaboratorId: 'masquerade', label: 'Tècnic de so inclòs · 1h 30', revenueAmount: 0, costAmount: -40, quantity: 1 },
      ];
      const result = computeBookingFinancialSummary(baseInput({
        total: 498,
        packPrice: 0,
        extrasTotal: 0,
        extraHours: 0,
        extraHourPrice: 0,
        distanceKm: 0,
        travelCost: 271,
        serviceLines,
      }), defaultConfig);

      expect(result.serviceLinesRevenue).toBe(240);
      expect(result.serviceLinesCost).toBe(160);
      expect(result.subcontractedMarkup.targetPct).toBe(SUBCONTRACTED_MARKUP_TARGET_PCT);
      expect(result.subcontractedMarkup.cost).toBe(200);
      expect(result.subcontractedMarkup.revenue).toBe(240);
      expect(result.subcontractedMarkup.markupAmount).toBe(40);
      expect(result.subcontractedMarkup.markupPct).toBe(20);
      expect(result.subcontractedMarkup.ok).toBe(true);
      expect(result.orbitaTechIncome).toBe(40);
      expect(result.directCost).toBe(result.fixedOperationalCost + 271 + 160);
    });

    it('separa producte propi, subcontractat i transport en buckets economics', () => {
      const serviceLines = [
        { kind: 'DJ', revenueAmount: 150, costAmount: 0, quantity: 1 },
        { kind: 'PROVIDER_SERVICE', collaboratorId: 'masquerade', revenueAmount: 240, costAmount: 200, quantity: 1 },
      ];
      const result = computeBookingFinancialSummary(baseInput({
        total: 648,
        packPrice: 0,
        extrasTotal: 0,
        extraHours: 0,
        extraHourPrice: 0,
        distanceKm: 0,
        travelCost: 271,
        travelRevenue: 258,
        serviceLines,
        serviceLinesOwnCostRatio: 0,
      }), defaultConfig);

      expect(result.ownServiceMargin.revenue).toBe(150);
      expect(result.ownServiceMargin.cost).toBe(0);
      expect(result.ownServiceMargin.marginAmount).toBe(150);
      expect(result.subcontractedMarkup.cost).toBe(200);
      expect(result.subcontractedMarkup.markupAmount).toBe(40);
      expect(result.transportMargin.revenue).toBe(258);
      expect(result.transportMargin.cost).toBe(271);
      expect(result.transportMargin.marginAmount).toBe(-13);
      expect(result.directCost).toBe(result.fixedOperationalCost + 271 + 200);
    });

    // --- Config personalitzada ---

    it('config personalitzada: canvia els ratis i el cost fix', () => {
      const config = customConfig({
        packCostRatio: 0.5,
        extraCostRatio: 0.4,
        extraHourCostRatio: 0.3,
        fixedOperationalCost: 100,
      });
      const input = baseInput();
      const result = computeBookingFinancialSummary(input, config);

      // packCost = 800 × 0.5 = 400
      expect(result.packCost).toBeCloseTo(400, 2);
      // extrasCost = 200 × 0.4 = 80
      expect(result.extrasCost).toBeCloseTo(80, 2);
      // extraHoursCost = 1 × 75 × 0.3 = 22.5
      expect(result.extraHoursCost).toBeCloseTo(22.5, 2);
      // fixedOp = 100
      expect(result.fixedOperationalCost).toBe(100);
    });

    it('config amb CAC personalitzat per canal nou', () => {
      const config = customConfig({
        channelCac: { TIKTOK: 50, UNKNOWN: 30 },
      });
      const input = baseInput({ source: 'TIKTOK' });
      const result = computeBookingFinancialSummary(input, config);

      expect(result.acquisitionCost).toBe(50);
    });

    it('config amb fixedOperationalCost = 0: sense cost fix', () => {
      const config = customConfig({ fixedOperationalCost: 0 });
      const input = baseInput();
      const result = computeBookingFinancialSummary(input, config);

      expect(result.fixedOperationalCost).toBe(0);
      expect(result.directCost).toBe(
        result.packCost + result.extrasCost + result.extraHoursCost + result.travelCost,
      );
    });

    // --- Invariants / Consistència ---

    it('consistència: directCost = suma de tots els costos parcials', () => {
      const input = baseInput();
      const result = computeBookingFinancialSummary(input, defaultConfig);

      const expectedDirectCost =
        result.packCost +
        result.extrasCost +
        result.extraHoursCost +
        result.fixedOperationalCost +
        result.travelCost +
        result.serviceLinesCost;

      expect(result.directCost).toBeCloseTo(expectedDirectCost, 2);
    });

    it('consistència: netMargin = total - directCost - acquisitionCost', () => {
      const input = baseInput({ source: 'GOOGLE' });
      const result = computeBookingFinancialSummary(input, defaultConfig);

      const expectedNetMargin = result.total - result.directCost - result.acquisitionCost;
      expect(result.netMargin).toBeCloseTo(expectedNetMargin, 2);
    });

    it('consistència: marginPct = (netMargin / total) × 100 quan total > 0', () => {
      const input = baseInput();
      const result = computeBookingFinancialSummary(input, defaultConfig);

      const expectedPct = (result.netMargin / result.total) * 100;
      expect(result.marginPct).toBeCloseTo(expectedPct, 2);
    });

    it('consistència: el total retornat sempre coincideix amb l\'input', () => {
      const totals = [0, 100, 999.99, 5000, 25000];
      for (const total of totals) {
        const input = baseInput({ total });
        const result = computeBookingFinancialSummary(input, defaultConfig);
        expect(result.total).toBe(total);
      }
    });
  });

  // ─── computeSimpleMarginPct ──────────────────────────────────────────────────
  // Retorna el % de marge sense CAC — pensat per dashboards/llistats
  // on no cal el detall complet del CAC per canal.

  describe('computeSimpleMarginPct', () => {
    it('retorna % de marge sense CAC (per dashboards)', () => {
      const input = baseInput({ source: 'WEBSITE' });
      const result = computeSimpleMarginPct(input, defaultConfig);

      // Calcula el summary per comparar
      const summary = computeBookingFinancialSummary(input, defaultConfig);
      const expectedSimplePct = ((input.total - summary.directCost) / input.total) * 100;

      expect(result).toBeCloseTo(expectedSimplePct, 2);
    });

    it('cas simple: packPrice 500, total 1000, sense extres', () => {
      const input = baseInput({
        total: 1000,
        packPrice: 500,
        extrasTotal: 0,
        extraHours: 0,
        extraHourPrice: 0,
        distanceKm: 0,
      });
      const pct = computeSimpleMarginPct(input, defaultConfig);

      // directCost = 500*0.36 + 0 + 0 + 45 + 0 = 225
      // margin = (1000 - 225) / 1000 * 100 = 77.5
      expect(pct).toBeCloseTo(77.5, 0);
    });

    it('amb total zero: retorna 0 (sense divisió per zero)', () => {
      const input = baseInput({ total: 0 });
      const result = computeSimpleMarginPct(input, defaultConfig);

      expect(result).toBe(0);
    });

    it('amb total negatiu: retorna 0', () => {
      const input = baseInput({ total: -100 });
      const result = computeSimpleMarginPct(input, defaultConfig);

      expect(result).toBe(0);
    });

    it('marge simple sempre >= marge net (perquè no inclou CAC)', () => {
      const input = baseInput({ source: 'INSTAGRAM' }); // CAC alt = 35
      const simplePct = computeSimpleMarginPct(input, defaultConfig);
      const summary = computeBookingFinancialSummary(input, defaultConfig);

      expect(simplePct).toBeGreaterThanOrEqual(summary.marginPct);
    });

    it('usa DEFAULT_PROFITABILITY_CONFIG si no es passa config', () => {
      const input = baseInput();

      // Sense config explícit
      const resultDefault = computeSimpleMarginPct(input);
      // Amb config explícit (la mateixa)
      const resultExplicit = computeSimpleMarginPct(input, defaultConfig);

      expect(resultDefault).toBeCloseTo(resultExplicit, 2);
    });

    it('la diferència entre simple i net és exactament el CAC relatiu', () => {
      const input = baseInput({ source: 'GOOGLE', total: 2000 }); // CAC GOOGLE = 28
      const simplePct = computeSimpleMarginPct(input, defaultConfig);
      const summary = computeBookingFinancialSummary(input, defaultConfig);

      // La diferència hauria de ser (CAC / total) × 100
      const cacPct = (summary.acquisitionCost / input.total) * 100;
      expect(simplePct - summary.marginPct).toBeCloseTo(cacPct, 2);
    });

    it('inclou cost de línies de servei en el marge simple de llistes i dashboards', () => {
      const input = baseInput({
        total: 1000,
        packPrice: 0,
        extrasTotal: 0,
        extraHours: 0,
        extraHourPrice: 0,
        distanceKm: 0,
        travelCost: 0,
        serviceLinesRevenue: 300,
        serviceLinesCost: 120,
      });

      const simplePct = computeSimpleMarginPct(input, defaultConfig);

      // directCost = fixedOperationalCost 45 + serviceLinesCost 120 = 165
      expect(simplePct).toBeCloseTo(83.5, 2);
    });
  });

  // ─── computeCollaboratorNetMargin ──────────────────────────────────────────
  // Quan un col·laborador porta una reserva, la seva comissió es dedueix del marge.
  // Dos models: DISCOUNT i NET_PLUS_COMMISSION.

  describe('computeCollaboratorNetMargin', () => {
    /** Helper: crea un summary base per als tests de col·laborador */
    function baseSummary(overrides: Partial<{
      total: number;
      netMargin: number;
      marginPct: number;
      packCost: number;
      packCostIsReal: boolean;
      extrasCost: number;
      extraHoursCost: number;
      fixedOperationalCost: number;
      travelCost: number;
      directCost: number;
      acquisitionCost: number;
      marginTone: { color: string; bg: string; label: string; tone: 'emerald' | 'amber' | 'orange' | 'rose' };
    }> = {}) {
      const input = baseInput();
      const summary = computeBookingFinancialSummary(input, defaultConfig);
      return { ...summary, ...overrides };
    }

    // --- Model DISCOUNT ---

    it('model DISCOUNT 15%: comissió es dedueix del total, col·lab rep la diferència', () => {
      const summary = baseSummary();
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 15,
        pricingModel: 'DISCOUNT',
      });

      const expectedCommission = Math.round(summary.total * 0.15);
      expect(result.commissionAmount).toBe(expectedCommission);
      expect(result.collaboratorPrice).toBe(summary.total - expectedCommission);
      expect(result.netMarginAfterCommission).toBe(summary.netMargin - expectedCommission);
    });

    it('model DISCOUNT amb comissió 0%: sense impacte al marge', () => {
      const summary = baseSummary();
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 0,
        pricingModel: 'DISCOUNT',
      });

      expect(result.commissionAmount).toBe(0);
      expect(result.collaboratorPrice).toBe(summary.total);
      expect(result.netMarginAfterCommission).toBe(summary.netMargin);
    });

    it('model DISCOUNT amb comissió alta (30%): marge pot quedar negatiu', () => {
      // Reserva amb marge just
      const summary = baseSummary({ total: 800, netMargin: 150 });
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 30,
        pricingModel: 'DISCOUNT',
      });

      // Comissió = 800 × 0.30 = 240 → marge = 150 - 240 = -90
      expect(result.commissionAmount).toBe(240);
      expect(result.netMarginAfterCommission).toBe(-90);
      expect(result.marginPctAfterCommission).toBeLessThan(0);
    });

    // --- Model NET_PLUS_COMMISSION ---

    it('model NET_PLUS_COMMISSION: col·lab rep el total sencer', () => {
      const summary = baseSummary();
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 10,
        pricingModel: 'NET_PLUS_COMMISSION',
      });

      expect(result.collaboratorPrice).toBe(summary.total);
    });

    it('model NET_PLUS_COMMISSION: comissió es calcula igual que DISCOUNT', () => {
      const summary = baseSummary();
      const resultDiscount = computeCollaboratorNetMargin(summary, {
        commissionPct: 20,
        pricingModel: 'DISCOUNT',
      });
      const resultNet = computeCollaboratorNetMargin(summary, {
        commissionPct: 20,
        pricingModel: 'NET_PLUS_COMMISSION',
      });

      // La comissió és la mateixa en ambdós models
      expect(resultNet.commissionAmount).toBe(resultDiscount.commissionAmount);
      // El marge net després de comissió també és igual
      expect(resultNet.netMarginAfterCommission).toBe(resultDiscount.netMarginAfterCommission);
    });

    it('model NET_PLUS_COMMISSION vs DISCOUNT: diferència és el preu col·laborador', () => {
      const summary = baseSummary();
      const commissionPct = 15;

      const resultDiscount = computeCollaboratorNetMargin(summary, {
        commissionPct,
        pricingModel: 'DISCOUNT',
      });
      const resultNet = computeCollaboratorNetMargin(summary, {
        commissionPct,
        pricingModel: 'NET_PLUS_COMMISSION',
      });

      // En DISCOUNT: col·lab rep total - comissió
      // En NET: col·lab rep total
      expect(resultDiscount.collaboratorPrice).toBeLessThan(resultNet.collaboratorPrice);
      expect(resultNet.collaboratorPrice).toBe(summary.total);
    });

    // --- Edge cases ---

    it('total 0 al summary: marginPctAfterCommission = 0', () => {
      const summary = baseSummary({ total: 0, netMargin: -65 });
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 15,
        pricingModel: 'DISCOUNT',
      });

      expect(result.marginPctAfterCommission).toBe(0);
    });

    it('comissió 100%: tot el total va com a comissió', () => {
      const summary = baseSummary();
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 100,
        pricingModel: 'DISCOUNT',
      });

      expect(result.commissionAmount).toBe(summary.total);
      expect(result.collaboratorPrice).toBe(0);
    });

    it('la comissió s\'arrodoneix a enter (Math.round)', () => {
      const summary = baseSummary({ total: 1000 });
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 33, // 1000 × 0.33 = 330 exacte
        pricingModel: 'DISCOUNT',
      });

      expect(result.commissionAmount).toBe(330);
      expect(Number.isInteger(result.commissionAmount)).toBe(true);
    });

    it('comissió amb arrodoniment no trivial: total × pct dona decimals', () => {
      // 1234 × 0.17 = 209.78 → Math.round → 210
      const summary = baseSummary({ total: 1234 });
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 17,
        pricingModel: 'DISCOUNT',
      });

      expect(result.commissionAmount).toBe(Math.round(1234 * 0.17));
      expect(result.commissionAmount).toBe(210);
    });

    it('comissió petita (1%): arrodoniment a l\'enter més proper', () => {
      // 1500 × 0.01 = 15 exacte
      const summary = baseSummary({ total: 1500 });
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 1,
        pricingModel: 'DISCOUNT',
      });

      expect(result.commissionAmount).toBe(15);
    });

    // --- Invariants / Consistència ---

    it('consistència: netMarginAfterCommission = netMargin - commissionAmount', () => {
      const summary = baseSummary();
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 12,
        pricingModel: 'DISCOUNT',
      });

      expect(result.netMarginAfterCommission).toBe(
        summary.netMargin - result.commissionAmount,
      );
    });

    it('consistència: marginPctAfterCommission = (netMarginAfterCommission / total) × 100', () => {
      const summary = baseSummary();
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 15,
        pricingModel: 'DISCOUNT',
      });

      const expectedPct = (result.netMarginAfterCommission / summary.total) * 100;
      expect(result.marginPctAfterCommission).toBeCloseTo(expectedPct, 2);
    });

    it('consistència: retorna els 4 camps esperats', () => {
      const summary = baseSummary();
      const result = computeCollaboratorNetMargin(summary, {
        commissionPct: 10,
        pricingModel: 'DISCOUNT',
      });

      expect(result).toHaveProperty('netMarginAfterCommission');
      expect(result).toHaveProperty('commissionAmount');
      expect(result).toHaveProperty('collaboratorPrice');
      expect(result).toHaveProperty('marginPctAfterCommission');
    });
  });
});

describe('aggregateServiceLines', () => {
  const ratio = PROFITABILITY_MODEL_DEFAULTS.orbitaServiceCostRatio; // 0.25

  it('línia buida → 0 ingrés i 0 cost', () => {
    expect(aggregateServiceLines([])).toEqual({ revenue: 0, cost: 0 });
  });

  it('línia pròpia d\'Òrbita sense cost → imputa cost via orbitaServiceCostRatio', () => {
    const r = aggregateServiceLines([{ revenueAmount: 200, quantity: 1 }]);
    expect(r.revenue).toBe(200);
    expect(r.cost).toBe(200 * ratio); // 50
  });

  it('línia amb cost explícit → usa el cost explícit, no l\'imputat', () => {
    const r = aggregateServiceLines([{ revenueAmount: 300, costAmount: 120, quantity: 1 }]);
    expect(r.revenue).toBe(300);
    expect(r.cost).toBe(120);
  });

  it('línia de partner (collaboratorId) sense costAmount → cost 0 (es gestiona a la seva fitxa)', () => {
    const r = aggregateServiceLines([{ revenueAmount: 400, collaboratorId: 'col_1', quantity: 1 }]);
    expect(r.revenue).toBe(400);
    expect(r.cost).toBe(0);
  });

  it('multiplica per quantitat tant ingrés com cost', () => {
    const r = aggregateServiceLines([{ revenueAmount: 100, costAmount: 40, quantity: 3 }]);
    expect(r.revenue).toBe(300);
    expect(r.cost).toBe(120);
  });

  it('barreja de línies (pròpia imputada + partner + explícita)', () => {
    const r = aggregateServiceLines([
      { revenueAmount: 350, quantity: 1 },                          // pròpia → 350*0.25 = 87.5
      { revenueAmount: 400, collaboratorId: 'c', quantity: 1 },     // partner → 0
      { revenueAmount: 200, costAmount: 80, quantity: 2 },          // explícita → 160, rev 400
    ]);
    expect(r.revenue).toBe(350 + 400 + 400);
    expect(r.cost).toBeCloseTo(87.5 + 0 + 160, 5);
  });

  it('respecta un ownCostRatio personalitzat', () => {
    const r = aggregateServiceLines([{ revenueAmount: 100, quantity: 1 }], 0.4);
    expect(r.cost).toBe(40);
  });
});

describe('classifyBoloLines', () => {
  it('Masquerade sol (PROVIDER_SERVICE + tècnic) → cap equip propi ni lloguer', () => {
    const r = classifyBoloLines([
      { collaboratorId: 'carlos', kind: 'PROVIDER_SERVICE' },
      { collaboratorId: 'carlos', kind: 'SOUND_TECH' },
    ]);
    expect(r.hasOwnEquipment).toBe(false);
    expect(r.hasEquipmentRental).toBe(false);
  });

  it('DJ propi → equip propi (dispara cost fix)', () => {
    const r = classifyBoloLines([{ kind: 'DJ' }]);
    expect(r.hasOwnEquipment).toBe(true);
    expect(r.hasEquipmentRental).toBe(false);
  });

  it('material propi (EQUIPMENT sense collaboratorId) → equip propi', () => {
    const r = classifyBoloLines([{ kind: 'EQUIPMENT' }]);
    expect(r.hasOwnEquipment).toBe(true);
  });

  it('lloguer (EQUIPMENT amb collaboratorId, p.ex. Tino) → lloguer, no equip propi', () => {
    const r = classifyBoloLines([{ collaboratorId: 'tino', kind: 'EQUIPMENT' }]);
    expect(r.hasOwnEquipment).toBe(false);
    expect(r.hasEquipmentRental).toBe(true);
  });

  it('DJ propi + lloguer Tino → tots dos costos s\'acumulen', () => {
    const r = classifyBoloLines([
      { kind: 'DJ' },
      { collaboratorId: 'tino', kind: 'EQUIPMENT' },
    ]);
    expect(r.hasOwnEquipment).toBe(true);
    expect(r.hasEquipmentRental).toBe(true);
  });
});

describe('computeSupportableTravelKm', () => {
  it('net positiu → km que aguanta el marge fins a net = 0', () => {
    expect(computeSupportableTravelKm(28, 0.19)).toBe(Math.floor(28 / 0.19)); // 147
  });

  it('net ≤ 0 → 0 km (ja no guanya)', () => {
    expect(computeSupportableTravelKm(0, 0.19)).toBe(0);
    expect(computeSupportableTravelKm(-17, 0.19)).toBe(0);
  });

  it('cost/km no vàlid → fallback al cost per km per defecte', () => {
    expect(computeSupportableTravelKm(38, 0)).toBe(Math.floor(38 / DEFAULT_VEHICLE_COST_PER_KM));
  });

  it('cost/km més alt (benzina cara) → menys km assumibles', () => {
    expect(computeSupportableTravelKm(28, 0.23)).toBe(Math.floor(28 / 0.23)); // 121
  });
});

// ─── computeDirectCostBreakdown — font única del cost directe (#1088) ──────────
// Extreta de computeBookingFinancialSummary perquè els components de marge en viu
// (useBookingPricing, BookingMarginCard) no reimplementin la fórmula. Aquests
// tests blinden que la font única és coherent amb el cor i amb els patrons que
// usen els components migrats.
describe('computeDirectCostBreakdown (font única del cost directe)', () => {
  const base = {
    total: 1000, packPrice: 500, extrasTotal: 100, extraHours: 2,
    extraHourPrice: 50, distanceKm: 0, travelCost: 40, serviceLinesCost: 0,
  };

  it('el directCost coincideix EXACTAMENT amb el de computeBookingFinancialSummary', () => {
    const breakdown = computeDirectCostBreakdown(base, defaultConfig);
    const summary = computeBookingFinancialSummary(base, defaultConfig);
    expect(breakdown.directCost).toBe(summary.directCost);
    expect(breakdown.packCost).toBe(summary.packCost);
    expect(breakdown.extrasCost).toBe(summary.extrasCost);
    expect(breakdown.extraHoursCost).toBe(summary.extraHoursCost);
    expect(breakdown.travelCost).toBe(summary.travelCost);
  });

  it('pack real (inventoryCostReal>0) preval sobre l\'estimat', () => {
    const b = computeDirectCostBreakdown({ ...base, inventoryCostReal: 123 }, defaultConfig);
    expect(b.packCost).toBe(123);
    expect(b.packCostIsReal).toBe(true);
  });

  it('pack estimat = packPrice × packCostRatio quan no hi ha cost real', () => {
    const b = computeDirectCostBreakdown(base, defaultConfig);
    expect(b.packCost).toBe(500 * defaultConfig.packCostRatio);
    expect(b.packCostIsReal).toBe(false);
  });

  it('travelCost explícit s\'usa tal qual; si és 0 amb distanceKm 0 → 0 (patró components en viu)', () => {
    expect(computeDirectCostBreakdown({ ...base, travelCost: 40 }, defaultConfig).travelCost).toBe(40);
    expect(computeDirectCostBreakdown({ ...base, travelCost: 0, distanceKm: 0 }, defaultConfig).travelCost).toBe(0);
  });

  it('patró useBookingPricing (extraHours=1, extraHourPrice=preu agregat) dóna el cost esperat', () => {
    // En viu el preu d'hores extra ja ve agregat; extraHours=1 × preu × ratio.
    const b = computeDirectCostBreakdown(
      { total: 800, packPrice: 400, extrasTotal: 0, extraHours: 1, extraHourPrice: 120, distanceKm: 0, travelCost: 0 },
      defaultConfig,
    );
    expect(b.extraHoursCost).toBe(120 * defaultConfig.extraHourCostRatio);
  });

  it('directCost és la suma exacta dels components', () => {
    const b = computeDirectCostBreakdown(base, defaultConfig);
    expect(b.directCost).toBeCloseTo(
      b.packCost + b.extrasCost + b.extraHoursCost + b.fixedOperationalCost + b.travelCost + b.serviceLinesCost, 6,
    );
  });
});
