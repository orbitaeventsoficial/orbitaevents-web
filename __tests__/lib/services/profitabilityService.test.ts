/**
 * Tests del sistema de rendibilitat (Profitability Service).
 *
 * La RENDIBILITAT mesura quant guanyes REALMENT després de descomptar
 * tots els costos. No és el mateix que la facturació (ingressos bruts).
 *
 * CONCEPTES CLAU:
 *
 * 1. RÀTIO DE COST (packCostRatio, extraCostRatio):
 *    Quin percentatge del preu de venda és cost real.
 *    Ex: packCostRatio = 0.36 → De cada 100 € que cobres pel pack,
 *    36 € són costos (material, muntatge, personal).
 *    Més baix = més marge, més alt = menys benefici.
 *
 * 2. COST OPERACIONAL FIX (fixedOperationalCost):
 *    Costos que tens per cada reserva, independentment del preu.
 *    Ex: 45 € per gasoil del generador, neteges, consumibles...
 *
 * 3. CAC (Cost d'Adquisició de Client):
 *    Quant costa aconseguir cada client segons el canal d'origen.
 *    Ex: Un client d'Instagram costa ~35 € (publicitat), un referit
 *    només 8 € (boca-orella). Això afecta el marge NET real.
 *
 * 4. NORMALITZACIÓ DE CONFIG:
 *    Quan l'operador desa una configuració, la normalitzem per evitar
 *    errors: els ràtios es limiten entre 0 i 1 (0% i 100%), i els
 *    valors invàlids es substitueixen pels per defecte.
 *
 * 5. PERSISTÈNCIA:
 *    La config es desa a la BD (taula Setting) com a JSON.
 *    Si no existeix o està corrupta, s'usen els valors per defecte.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  normalizeProfitabilityConfig,
  DEFAULT_PROFITABILITY_CONFIG,
} from '@/lib/services/profitabilityService';

describe('profitabilityService', () => {
  // ─── DEFAULT_PROFITABILITY_CONFIG ───────────────────────────────────────────
  // Valors per defecte que s'usen quan no hi ha config a la BD.
  // Basats en la realitat operativa d'Òrbita Events.

  describe('DEFAULT_PROFITABILITY_CONFIG', () => {
    it('packCostRatio per defecte és 0.36 (36% del preu és cost)', () => {
      expect(DEFAULT_PROFITABILITY_CONFIG.packCostRatio).toBe(0.36);
    });

    it('extraCostRatio per defecte és 0.28 (28% del preu d\'extres és cost)', () => {
      expect(DEFAULT_PROFITABILITY_CONFIG.extraCostRatio).toBe(0.28);
    });

    it('extraHourCostRatio per defecte és 0.2 (20% de les hores extra és cost)', () => {
      expect(DEFAULT_PROFITABILITY_CONFIG.extraHourCostRatio).toBe(0.2);
    });

    it('fixedOperationalCost per defecte és 45 € per reserva', () => {
      expect(DEFAULT_PROFITABILITY_CONFIG.fixedOperationalCost).toBe(45);
    });

    it('CAC per canal: referit (8€) és el més barat, Instagram (35€) el més car', () => {
      expect(DEFAULT_PROFITABILITY_CONFIG.channelCac.REFERRAL).toBe(8);
      expect(DEFAULT_PROFITABILITY_CONFIG.channelCac.INSTAGRAM).toBe(35);
    });

    it('tots els canals tenen un CAC definit', () => {
      const channels = Object.keys(DEFAULT_PROFITABILITY_CONFIG.channelCac);
      expect(channels.length).toBeGreaterThanOrEqual(8);
      channels.forEach((ch) => {
        expect(DEFAULT_PROFITABILITY_CONFIG.channelCac[ch]).toBeGreaterThan(0);
      });
    });
  });

  // ─── normalizeProfitabilityConfig ───────────────────────────────────────────
  // Aquesta funció "neteja" la configuració que ens arriba.
  // Si l'operador escriu un valor fora de rang, el corregim automàticament.

  describe('normalizeProfitabilityConfig', () => {
    it('null → retorna els valors per defecte (config buida)', () => {
      const result = normalizeProfitabilityConfig(null);
      expect(result).toEqual(DEFAULT_PROFITABILITY_CONFIG);
    });

    it('undefined → retorna els valors per defecte', () => {
      const result = normalizeProfitabilityConfig(undefined);
      expect(result).toEqual(DEFAULT_PROFITABILITY_CONFIG);
    });

    it('objecte buit → retorna els valors per defecte', () => {
      const result = normalizeProfitabilityConfig({});
      expect(result).toEqual(DEFAULT_PROFITABILITY_CONFIG);
    });

    it('config parcial → fusiona amb valors per defecte (no perd res)', () => {
      const result = normalizeProfitabilityConfig({
        packCostRatio: 0.40,
      });
      expect(result.packCostRatio).toBe(0.40);
      expect(result.extraCostRatio).toBe(DEFAULT_PROFITABILITY_CONFIG.extraCostRatio);
      expect(result.fixedOperationalCost).toBe(DEFAULT_PROFITABILITY_CONFIG.fixedOperationalCost);
    });

    it('ràtio > 1 → es limita a 1 (no pot ser > 100%)', () => {
      const result = normalizeProfitabilityConfig({
        packCostRatio: 2.5,
      });
      expect(result.packCostRatio).toBe(1);
    });

    it('ràtio < 0 → es limita a 0 (no pot ser negatiu)', () => {
      const result = normalizeProfitabilityConfig({
        extraCostRatio: -0.5,
      });
      expect(result.extraCostRatio).toBe(0);
    });

    it('ràtio no numèric (ex: "abc") → usa el valor per defecte', () => {
      const result = normalizeProfitabilityConfig({
        packCostRatio: 'abc',
      });
      expect(result.packCostRatio).toBe(DEFAULT_PROFITABILITY_CONFIG.packCostRatio);
    });

    it('fixedOperationalCost accepta qualsevol número vàlid (no és un ràtio)', () => {
      const result = normalizeProfitabilityConfig({
        fixedOperationalCost: 120,
      });
      expect(result.fixedOperationalCost).toBe(120);
    });

    it('channelCac parcial → fusiona amb els per defecte', () => {
      const result = normalizeProfitabilityConfig({
        channelCac: { REFERRAL: 5 },
      });
      expect(result.channelCac.REFERRAL).toBe(5);
      expect(result.channelCac.INSTAGRAM).toBe(DEFAULT_PROFITABILITY_CONFIG.channelCac.INSTAGRAM);
    });
  });

  describe('fetchProfitabilityBookings pagination shape', () => {
    const source = readFileSync(join(process.cwd(), 'lib', 'services', 'profitabilityService.ts'), 'utf8');

    it('usa una condició explícita per paginar, no un while infinit', () => {
      expect(source).toContain('let hasMoreBookings = true');
      expect(source).toContain('while (hasMoreBookings)');
      expect(source).toContain('batch.length === PROFITABILITY_BATCH_SIZE');
      expect(source).not.toContain('while (true)');
    });
  });
});
