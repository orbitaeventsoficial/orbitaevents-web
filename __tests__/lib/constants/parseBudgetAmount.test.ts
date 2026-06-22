import { describe, it, expect } from 'vitest';
import { parseBudgetAmount } from '@/lib/constants';

// Font única canònica del parseig de pressupost (string lliure → número).
// Abans hi havia 5+ implementacions duplicades i DIVERGENTS; aquesta unifica i
// corregeix el cas del decimal amb punt ("300.50") que les versions simples
// (replace(/\./g,'')) interpretaven malament com a 30050.
describe('parseBudgetAmount (font canònica)', () => {
  it('xifra simple', () => {
    expect(parseBudgetAmount('300')).toBe(300);
    expect(parseBudgetAmount('500')).toBe(500);
  });

  it('amb símbol o text', () => {
    expect(parseBudgetAmount('300€')).toBe(300);
    expect(parseBudgetAmount('300 EUR')).toBe(300);
  });

  it('punt com a separador de miler (europeu)', () => {
    expect(parseBudgetAmount('1.200')).toBe(1200);
    expect(parseBudgetAmount('1.500')).toBe(1500);
  });

  it('coma decimal (europeu)', () => {
    expect(parseBudgetAmount('1.500,50')).toBeCloseTo(1500.5, 2);
    expect(parseBudgetAmount('1.200,50 €')).toBeCloseTo(1200.5, 2);
  });

  it('punt decimal (anglès) — el cas que abans donava bug', () => {
    // Les versions simples retornaven 30050; la canònica el llegeix com 300.50.
    expect(parseBudgetAmount('300.50')).toBeCloseTo(300.5, 2);
  });

  it('retorna null per buit / no numèric / zero', () => {
    expect(parseBudgetAmount(null)).toBeNull();
    expect(parseBudgetAmount(undefined)).toBeNull();
    expect(parseBudgetAmount('')).toBeNull();
    expect(parseBudgetAmount('no ho sé')).toBeNull();
    expect(parseBudgetAmount('0')).toBeNull();
  });
});
