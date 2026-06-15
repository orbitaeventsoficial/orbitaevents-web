/**
 * Tests del sistema de cost de viatge.
 *
 * Quan un equip d'Òrbita Events es desplaça a un esdeveniment, els costos
 * de viatge es calculen així:
 *
 * 1. QUILÒMETRES INCLOSOS: Els primers 50 km (anada + tornada) estan
 *    inclosos al preu del pack. No es cobra res extra.
 *
 * 2. QUILÒMETRES FACTURABLES: Tot el que superi els 50 km inclosos.
 *    Ex: Si la ruta total és 90 km → 90 - 50 = 40 km facturables.
 *
 * 3. TRAMS: Els km facturables es divideixen en blocs de 20 km.
 *    Cada tram que comenci es cobra sencer (arrodoniment cap amunt).
 *    Ex: 21 km facturables → 2 trams (un de 20 + un que s'ha iniciat).
 *
 * 4. PREU CLIENT: Cada tram costa 10 € al client.
 *    Ex: 2 trams × 10 € = 20 € de suplement transport.
 *
 * 5. COST INTERN VEHICLE: El cost real per km del vehicle (benzina +
 *    manteniment + assegurança + amortització). Per defecte 0.19 €/km.
 *    S'aplica a TOTS els km (no només facturables), perquè el vehicle
 *    consumeix des del primer quilòmetre.
 *
 * 6. MARGE TRANSPORT: La diferència entre el que es cobra al client
 *    (suplement) i el que costa realment (cost vehicle × km totals).
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeNonNegative,
  calculateBillableTravelKm,
  calculateTravelBlocks,
  calculateTravelCost,
  calculateTravelCharge,
  getIncludedTravelOneWayKm,
  DEFAULT_VEHICLE_COST_PER_KM,
  INCLUDED_TRAVEL_KM,
  TRAVEL_BLOCK_KM,
  TRAVEL_BLOCK_EUR,
} from '@/lib/services/travelCost';

describe('travelCost', () => {
  // ─── sanitizeNonNegative ────────────────────────────────────────────────────
  // Aquesta funció assegura que els valors numèrics siguin vàlids i no negatius.
  // Si algú escriu "-10" o "abc" al formulari, retorna un valor segur (fallback).

  describe('sanitizeNonNegative', () => {
    it('retorna el número tal qual si és positiu', () => {
      expect(sanitizeNonNegative(42)).toBe(42);
    });

    it('retorna 0 per a valors vàlids de zero', () => {
      expect(sanitizeNonNegative(0)).toBe(0);
    });

    it('retorna el fallback si el número és negatiu (no té sentit un km negatiu)', () => {
      expect(sanitizeNonNegative(-5, 10)).toBe(10);
    });

    it('retorna el fallback si rep NaN (text invàlid convertit a número)', () => {
      expect(sanitizeNonNegative(NaN, 7)).toBe(7);
    });

    it('retorna el fallback si rep Infinity (valor impossible)', () => {
      expect(sanitizeNonNegative(Infinity, 3)).toBe(3);
      expect(sanitizeNonNegative(-Infinity, 3)).toBe(3);
    });

    it('converteix strings numèrics vàlids a número', () => {
      expect(sanitizeNonNegative('25')).toBe(25);
    });

    it('retorna fallback per a strings no numèrics', () => {
      expect(sanitizeNonNegative('abc', 0)).toBe(0);
    });

    it('retorna 0 per defecte si no hi ha fallback', () => {
      expect(sanitizeNonNegative(-1)).toBe(0);
    });
  });

  // ─── calculateBillableTravelKm ──────────────────────────────────────────────
  // Calcula quants km són facturables (descomptant els inclosos al pack).

  describe('calculateBillableTravelKm', () => {
    it('0 km → 0 facturables (no hi ha viatge)', () => {
      expect(calculateBillableTravelKm(0)).toBe(0);
    });

    it('exactament 40 km → 0 facturables (tot inclòs al pack)', () => {
      expect(calculateBillableTravelKm(40)).toBe(0);
    });

    it('menys de 50 km → 0 facturables', () => {
      expect(calculateBillableTravelKm(30)).toBe(0);
    });

    it('90 km → 40 km facturables (90 - 50 inclosos)', () => {
      expect(calculateBillableTravelKm(90)).toBe(40);
    });

    it('51 km → 1 km facturable (just passats els 50 inclosos)', () => {
      expect(calculateBillableTravelKm(51)).toBe(1);
    });

    it('un valor negatiu retorna 0 (impossible fer km negatius)', () => {
      expect(calculateBillableTravelKm(-10)).toBe(0);
    });
  });

  // ─── calculateTravelBlocks ──────────────────────────────────────────────────
  // Divideix els km facturables en trams de 20 km.
  // Cada tram que comenci es cobra sencer (arrodoniment cap amunt).

  describe('calculateTravelBlocks', () => {
    it('50 km → 0 trams (tot inclòs)', () => {
      expect(calculateTravelBlocks(50)).toBe(0);
    });

    it('70 km → 1 tram (20 km facturables = exactament 1 tram)', () => {
      expect(calculateTravelBlocks(70)).toBe(1);
    });

    it('71 km → 2 trams (21 km facturables, el segon tram ja ha començat)', () => {
      expect(calculateTravelBlocks(71)).toBe(2);
    });

    it('90 km → 2 trams (40 km facturables = exactament 2 trams)', () => {
      expect(calculateTravelBlocks(90)).toBe(2);
    });

    it('91 km → 3 trams (41 km facturables, el tercer ha començat)', () => {
      expect(calculateTravelBlocks(91)).toBe(3);
    });

    it('0 km → 0 trams', () => {
      expect(calculateTravelBlocks(0)).toBe(0);
    });
  });

  // ─── calculateTravelCost ───────────────────────────────────────────────────
  // Cost REAL intern del vehicle. S'aplica a TOTS els km recorreguts.
  // Fórmula: km_totals × cost_per_km

  describe('calculateTravelCost', () => {
    it('calcula el cost total correctament (100 km × 0.19 €/km = 19 €)', () => {
      expect(calculateTravelCost(100, 0.19)).toBe(19);
    });

    it('0 km → 0 € de cost (no s\'ha mogut)', () => {
      expect(calculateTravelCost(0, 0.19)).toBe(0);
    });

    it('permet un cost per km personalitzat (empresa amb vehicle elèctric més barat)', () => {
      expect(calculateTravelCost(100, 0.10)).toBe(10);
    });

    it('usa el valor per defecte si el cost és invàlid', () => {
      const result = calculateTravelCost(100, -1);
      expect(result).toBe(100 * DEFAULT_VEHICLE_COST_PER_KM);
    });
  });

  // ─── calculateTravelCharge ──────────────────────────────────────────────────
  // El que es COBRA AL CLIENT per desplaçament.
  // Depèn dels trams (blocs de 20 km) × preu per tram (10 €).

  describe('calculateTravelCharge', () => {
    it('50 km → 0 € (tot inclòs, no es cobra res)', () => {
      expect(calculateTravelCharge(50)).toBe(0);
    });

    it('70 km → 10 € (1 tram × 10 €)', () => {
      expect(calculateTravelCharge(70)).toBe(10);
    });

    it('71 km → 20 € (2 trams × 10 €, perquè el 2n tram ja s\'ha iniciat)', () => {
      expect(calculateTravelCharge(71)).toBe(20);
    });

    it('91 km → 30 € (3 trams × 10 €)', () => {
      expect(calculateTravelCharge(91)).toBe(30);
    });

    it('0 km → 0 € (sense viatge)', () => {
      expect(calculateTravelCharge(0)).toBe(0);
    });
  });

  // ─── getIncludedTravelOneWayKm ──────────────────────────────────────────────
  // Calcula quants km d'anada estan inclosos (la meitat del total inclòs).
  // Serveix per mostrar a la UI: "Inclòs: 20 km anada + 20 km tornada"

  describe('getIncludedTravelOneWayKm', () => {
    it('40 km inclosos → 20 km d\'anada (meitat)', () => {
      expect(getIncludedTravelOneWayKm(40)).toBe(20);
    });

    it('usa el valor per defecte si no s\'especifica', () => {
      expect(getIncludedTravelOneWayKm()).toBe(INCLUDED_TRAVEL_KM / 2);
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────────────

  describe('constants', () => {
    it('els km inclosos per defecte són 50 (anada+tornada = 25 km/sentit)', () => {
      expect(INCLUDED_TRAVEL_KM).toBe(50);
    });

    it('el cost vehicle per defecte és 0.19 €/km', () => {
      expect(DEFAULT_VEHICLE_COST_PER_KM).toBe(0.19);
    });

    it('un tram és de 20 km', () => {
      expect(TRAVEL_BLOCK_KM).toBe(20);
    });

    it('cada tram costa 10 € al client', () => {
      expect(TRAVEL_BLOCK_EUR).toBe(10);
    });
  });
});
