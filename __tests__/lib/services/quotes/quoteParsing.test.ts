import { describe, it, expect } from 'vitest';

import {
  mapLeadEventType,
  parseDateOrNull,
  normalizeQuoteLocale,
} from '@/lib/services/quotes/quoteParsing';

describe('mapLeadEventType', () => {
  it('mapeja bodas/wedding a WEDDING', () => {
    expect(mapLeadEventType('bodas')).toBe('WEDDING');
    expect(mapLeadEventType('wedding')).toBe('WEDDING');
  });

  it('mapeja empresas/corporate a CORPORATE', () => {
    expect(mapLeadEventType('empresas')).toBe('CORPORATE');
    expect(mapLeadEventType('corporate')).toBe('CORPORATE');
  });

  it('mapeja fiestas/private_party a PRIVATE_PARTY', () => {
    expect(mapLeadEventType('fiestas')).toBe('PRIVATE_PARTY');
    expect(mapLeadEventType('private_party')).toBe('PRIVATE_PARTY');
  });

  it('retorna OTHER per valor desconegut', () => {
    expect(mapLeadEventType('desconegut')).toBe('OTHER');
    expect(mapLeadEventType(null)).toBe('OTHER');
    expect(mapLeadEventType(undefined)).toBe('OTHER');
    expect(mapLeadEventType('')).toBe('OTHER');
  });
});

describe('parseDateOrNull', () => {
  it('retorna Date per string vàlid', () => {
    const result = parseDateOrNull('2026-06-15');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2026);
  });

  it('retorna null per valors buits', () => {
    expect(parseDateOrNull(null)).toBeNull();
    expect(parseDateOrNull(undefined)).toBeNull();
    expect(parseDateOrNull('')).toBeNull();
  });

  it('retorna null per string invàlid', () => {
    expect(parseDateOrNull('not-a-date')).toBeNull();
  });
});

describe('normalizeQuoteLocale', () => {
  it('retorna ca per defecte', () => {
    expect(normalizeQuoteLocale(null)).toBe('ca');
    expect(normalizeQuoteLocale(undefined)).toBe('ca');
    expect(normalizeQuoteLocale('')).toBe('ca');
  });

  it('detecta es', () => {
    expect(normalizeQuoteLocale('es')).toBe('es');
    expect(normalizeQuoteLocale('es-ES')).toBe('es');
  });

  it('detecta en', () => {
    expect(normalizeQuoteLocale('en')).toBe('en');
    expect(normalizeQuoteLocale('en-GB')).toBe('en');
  });

  it('retorna ca per desconeguts', () => {
    expect(normalizeQuoteLocale('fr')).toBe('ca');
  });
});
