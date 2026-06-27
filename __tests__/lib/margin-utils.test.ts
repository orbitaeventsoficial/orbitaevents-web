/**
 * Tests del sistema de marges i semàfors d'Òrbita Events.
 *
 * QUÈ ÉS EL MARGE?
 * El marge és el percentatge de benefici que queda després de
 * descomptar els costos directes del preu que paga el client.
 * Ex: Si cobres 1000 € i els costos són 300 €, el marge és 70%.
 *
 * SEMÀFOR DE MARGE GENERAL (getMarginTone):
 * El sistema mostra un color segons la salut del marge:
 *   ≥50% → VERD (Excel·lent): Marge molt sa, negoci rendible.
 *   ≥30% → AMBRE (Acceptable): Correcte, però vigila els costos.
 *   ≥15% → TARONJA (Vigilar): Marge baix, revisa descomptes i transport.
 *   <15% → VERMELL (Crític): Estàs perdent diners o gairebé.
 *
 * SEMÀFOR DE MARGE TRANSPORT (getTravelMarginTone):
 * El transport té el seu propi semàfor perquè els marges
 * són naturalment més baixos (costos fixos per km):
 *   ≥45% → VERD: El suplement cobreix bé els costos.
 *   ≥20% → TARONJA: Cobres menys del que hauries.
 *   <20% → VERMELL: Estàs subvencionant el transport.
 *
 * FÓRMULA DE MARGE SIMPLIFICAT (calculateSimpleMarginPct):
 * Cost directe = (preu_pack × ràtio) + (extres × ràtio) + cost_fix + cost_viatge
 * Marge % = ((total - cost_directe) / total) × 100
 */

import { describe, it, expect } from 'vitest';
import {
  getMarginTone, getTravelMarginTone, calculateSimpleMarginPct,
  getMarginBand, getMarginLabel, getMarginTextClass, getMarginBarClass,
} from '@/lib/margin-utils';

describe('margin-utils', () => {
  // ─── getMarginBand ── font única de llindars del semàfor de marge (4 bandes)
  describe('getMarginBand — banda canònica (font única de llindars)', () => {
    it('classifica les 4 bandes pels llindars 50/30/15', () => {
      expect(getMarginBand(60)).toBe('excellent');
      expect(getMarginBand(50)).toBe('excellent');
      expect(getMarginBand(49.9)).toBe('acceptable');
      expect(getMarginBand(30)).toBe('acceptable');
      expect(getMarginBand(29.9)).toBe('watch');
      expect(getMarginBand(15)).toBe('watch');
      expect(getMarginBand(14.9)).toBe('critical');
      expect(getMarginBand(0)).toBe('critical');
      expect(getMarginBand(-10)).toBe('critical');
    });

    it('getMarginTone deriva de getMarginBand (mateixos llindars)', () => {
      expect(getMarginTone(20).tone).toBe('orange'); // watch
      expect(getMarginBand(20)).toBe('watch');
    });

    it('getMarginLabel retorna l’etiqueta catalana de la banda', () => {
      expect(getMarginLabel(60)).toBe('Excel·lent');
      expect(getMarginLabel(35)).toBe('Acceptable');
      expect(getMarginLabel(20)).toBe('Vigilar');
      expect(getMarginLabel(5)).toBe('Crític');
    });

    it('getMarginTextClass / getMarginBarClass retornen la classe canònica per banda', () => {
      expect(getMarginTextClass(20)).toBe('o-margin-text--watch');
      expect(getMarginBarClass(20)).toBe('o-margin-bar--watch');
      expect(getMarginTextClass(60)).toBe('o-margin-text--excellent');
      expect(getMarginBarClass(5)).toBe('o-margin-bar--critical');
    });
  });

  // ─── getMarginTone ──────────────────────────────────────────────────────────
  // Determina el color del semàfor segons el percentatge de marge.

  describe('getMarginTone — semàfor de marge general', () => {
    it('≥50% → verd (Excel·lent): el negoci va molt bé', () => {
      expect(getMarginTone(50).tone).toBe('emerald');
      expect(getMarginTone(75).tone).toBe('emerald');
      expect(getMarginTone(100).tone).toBe('emerald');
    });

    it('≥30% → ambre (Acceptable): correcte però pot millorar', () => {
      expect(getMarginTone(30).tone).toBe('amber');
      expect(getMarginTone(49.9).tone).toBe('amber');
    });

    it('≥15% → taronja (Vigilar): risc de no ser rendible', () => {
      expect(getMarginTone(15).tone).toBe('orange');
      expect(getMarginTone(29.9).tone).toBe('orange');
    });

    it('<15% → vermell (Crític): estàs perdent diners', () => {
      expect(getMarginTone(14.9).tone).toBe('rose');
      expect(getMarginTone(0).tone).toBe('rose');
      expect(getMarginTone(-10).tone).toBe('rose');
    });

    it('les etiquetes de text són correctes i en català', () => {
      expect(getMarginTone(55).label).toBe('Excel·lent');
      expect(getMarginTone(35).label).toBe('Acceptable');
      expect(getMarginTone(20).label).toBe('Vigilar');
      expect(getMarginTone(5).label).toBe('Crític');
    });

    it('retorna classes CSS vàlides per aplicar colors', () => {
      const emerald = getMarginTone(60);
      expect(emerald.color).toContain('emerald');
      expect(emerald.bg).toContain('emerald');
    });

    it('frontera: exactament 50% → verd (inclòs)', () => {
      expect(getMarginTone(50).tone).toBe('emerald');
    });

    it('frontera: exactament 30% → ambre (inclòs)', () => {
      expect(getMarginTone(30).tone).toBe('amber');
    });

    it('frontera: exactament 15% → taronja (inclòs)', () => {
      expect(getMarginTone(15).tone).toBe('orange');
    });
  });

  // ─── getTravelMarginTone ────────────────────────────────────────────────────
  // Semàfor específic per transport. Llindars més baixos perquè
  // els costos de vehicle són proporcionalment més alts.

  describe('getTravelMarginTone — semàfor de marge transport', () => {
    it('≥45% → verd: el suplement transport cobreix bé els costos', () => {
      expect(getTravelMarginTone(45).tone).toBe('emerald');
      expect(getTravelMarginTone(80).tone).toBe('emerald');
    });

    it('≥20% → taronja: cobres però no prou per cobrir desgast vehicle', () => {
      expect(getTravelMarginTone(20).tone).toBe('orange');
      expect(getTravelMarginTone(44.9).tone).toBe('orange');
    });

    it('<20% → vermell: estàs subvencionant el transport del client', () => {
      expect(getTravelMarginTone(19.9).tone).toBe('rose');
      expect(getTravelMarginTone(0).tone).toBe('rose');
      expect(getTravelMarginTone(-5).tone).toBe('rose');
    });

    it('frontera: exactament 45% → verd', () => {
      expect(getTravelMarginTone(45).tone).toBe('emerald');
    });

    it('frontera: exactament 20% → taronja', () => {
      expect(getTravelMarginTone(20).tone).toBe('orange');
    });

    it('retorna classes CSS de border, fons i text', () => {
      const tone = getTravelMarginTone(50);
      expect(tone.border).toContain('border-');
      expect(tone.bg).toContain('bg-');
      expect(tone.color).toContain('text-');
    });
  });

  // ─── calculateSimpleMarginPct ───────────────────────────────────────────────
  // Calcula el % de marge d'una reserva d'una manera simplificada.
  // Exemple pràctic: Si una reserva factura 1000 € i els costos són 301 €,
  // el marge és (1000 - 301) / 1000 × 100 = 69.9%.

  describe('calculateSimpleMarginPct — càlcul de marge per reserva', () => {
    const baseParams = {
      total: 1000,       // El que paga el client
      packPrice: 500,    // Preu del pack contractat
      extrasTotal: 200,  // Preu dels extres (llums extra, fotomatò, etc.)
      packCostRatio: 0.36,  // 36% del pack són costos (material, personal)
      extraCostRatio: 0.28, // 28% dels extres són costos
      fixedOperationalCost: 45, // Cost fix: generador, neteges, consumibles
      travelCost: 20,    // Cost real del desplaçament (benzina + desgast)
    };

    it('cas típic: reserva de 1000 € → marge ~69.9%', () => {
      // Cost directe = 500×0.36 + 200×0.28 + 45 + 20 = 180 + 56 + 45 + 20 = 301 €
      // Marge = (1000 - 301) / 1000 × 100 = 69.9%
      const result = calculateSimpleMarginPct(baseParams);
      expect(result).toBeCloseTo(69.9, 1);
    });

    it('total 0 € → marge 0% (no pots dividir per zero)', () => {
      expect(calculateSimpleMarginPct({ ...baseParams, total: 0 })).toBe(0);
    });

    it('total negatiu → marge 0% (reserva anul·lada / abonament)', () => {
      expect(calculateSimpleMarginPct({ ...baseParams, total: -100 })).toBe(0);
    });

    it('costos > ingressos → marge NEGATIU (perds diners!)', () => {
      const result = calculateSimpleMarginPct({
        ...baseParams,
        total: 100,      // Cobres poc
        packPrice: 500,  // Però el pack és car
        travelCost: 200, // I el viatge és llarg
      });
      expect(result).toBeLessThan(0);
    });

    it('sense extres → marge més alt (menys costos)', () => {
      const result = calculateSimpleMarginPct({ ...baseParams, extrasTotal: 0 });
      // Cost = 180 + 0 + 45 + 20 = 245 €
      // Marge = (1000 - 245) / 1000 × 100 = 75.5%
      expect(result).toBeCloseTo(75.5, 1);
    });

    it('sense viatge → marge més alt (estalvi en desplaçament)', () => {
      const result = calculateSimpleMarginPct({ ...baseParams, travelCost: 0 });
      // Cost = 180 + 56 + 45 + 0 = 281 €
      // Marge = (1000 - 281) / 1000 × 100 = 71.9%
      expect(result).toBeCloseTo(71.9, 1);
    });
  });
});
