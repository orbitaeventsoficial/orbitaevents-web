import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getPublicStatsLocale,
  getFallbackPublicStats,
} from '@/lib/services/publicStatsService';

describe('getPublicStatsLocale', () => {
  it('retorna es per defecte', () => {
    expect(getPublicStatsLocale(null)).toBe('es');
  });

  it('retorna es per valor invàlid', () => {
    expect(getPublicStatsLocale('fr')).toBe('es');
  });

  it('retorna ca si es passa ca', () => {
    expect(getPublicStatsLocale('ca')).toBe('ca');
  });

  it('retorna en si es passa en', () => {
    expect(getPublicStatsLocale('en')).toBe('en');
  });

  it('retorna es si es passa es', () => {
    expect(getPublicStatsLocale('es')).toBe('es');
  });
});

describe('getFallbackPublicStats', () => {
  it('retorna estructura completa en ca', () => {
    const result = getFallbackPublicStats('ca');

    expect(result.coverage).toBe('Barcelona + Girona');
    expect(result.responseTime).toBe('2h');
    expect(result.yearStarted).toBe(2023);
    expect(result.peopleEntertained).toBe(0);
    expect(result.technicalIncidents).toBe(0);
    expect(result.totalEvents).toBe(0);
    expect(result.totalWeddings).toBe(0);
    expect(result.totalCorporate).toBe(0);
    expect(result.totalParties).toBe(0);
    expect(result.averageRating).toBe(0);
    expect(result.googleRating).toBeNull();
    expect(result.googleReviewsCount).toBeNull();
  });

  it('yearsExperience en català', () => {
    const result = getFallbackPublicStats('ca');
    expect(result.yearsExperience).toContain('anys');
  });

  it('yearsExperience en castellà', () => {
    const result = getFallbackPublicStats('es');
    expect(result.yearsExperience).toContain('años');
  });

  it('yearsExperience en anglès', () => {
    const result = getFallbackPublicStats('en');
    expect(result.yearsExperience).toContain('years');
  });

  it('anys calculats dinàmicament', () => {
    const result = getFallbackPublicStats('ca');
    const currentYear = new Date().getFullYear();
    const expectedYears = currentYear - 2023;
    expect(result.yearsExperience).toContain(String(expectedYears));
  });

  it('cobertura idèntica en tots els idiomes', () => {
    expect(getFallbackPublicStats('ca').coverage).toBe('Barcelona + Girona');
    expect(getFallbackPublicStats('es').coverage).toBe('Barcelona + Girona');
    expect(getFallbackPublicStats('en').coverage).toBe('Barcelona + Girona');
  });
});
