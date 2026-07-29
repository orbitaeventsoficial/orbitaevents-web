import { describe, expect, it } from 'vitest';
import { normalizePublicLocale } from '@/lib/public-locale';

describe('normalizePublicLocale', () => {
  it('accepta locales públics exactes', () => {
    expect(normalizePublicLocale('ca')).toBe('ca');
    expect(normalizePublicLocale('es')).toBe('es');
    expect(normalizePublicLocale('en')).toBe('en');
  });

  it('redueix variants regionals al locale públic', () => {
    expect(normalizePublicLocale('ca-ES')).toBe('ca');
    expect(normalizePublicLocale('es_ES')).toBe('es');
    expect(normalizePublicLocale('en-US')).toBe('en');
  });

  it('fa servir ca com a fallback públic per defecte', () => {
    expect(normalizePublicLocale(undefined)).toBe('ca');
    expect(normalizePublicLocale('fr')).toBe('ca');
  });

  it('respecta un fallback explícit vàlid', () => {
    expect(normalizePublicLocale('fr', 'es')).toBe('es');
  });
});
