import { describe, it, expect } from 'vitest';
import { formatPdfDateInput } from '@/lib/utils/pdfHelpers';

describe('formatPdfDateInput', () => {
  it('formata una data ISO string en català', () => {
    const result = formatPdfDateInput('2026-09-15', 'ca');
    expect(result).toBeTruthy();
    expect(result).not.toBe('Invalid Date');
  });

  it('formata una data ISO string en espanyol', () => {
    const result = formatPdfDateInput('2026-09-15', 'es');
    expect(result).toBeTruthy();
    expect(result).not.toBe('Invalid Date');
  });

  it('formata un objecte Date', () => {
    const result = formatPdfDateInput(new Date('2026-09-15'), 'ca');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(3);
  });

  it('retorna la cadena original si la data és invàlida', () => {
    const result = formatPdfDateInput('not-a-date', 'ca');
    expect(result).toBe('not-a-date');
  });
});
