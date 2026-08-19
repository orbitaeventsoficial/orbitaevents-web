import { describe, it, expect } from 'vitest';
import { getErrorMessage, UNKNOWN_ERROR_MESSAGE } from '@/lib/utils/errors';

describe('getErrorMessage', () => {
  it('retorna el missatge d\'un Error', () => {
    expect(getErrorMessage(new Error('Ha petat la BD'))).toBe('Ha petat la BD');
  });

  it('retorna el missatge d\'una subclasse d\'Error', () => {
    class HttpError extends Error {}
    expect(getErrorMessage(new HttpError('404'))).toBe('404');
  });

  it('cau al text de reserva si l\'Error no té missatge', () => {
    expect(getErrorMessage(new Error(''))).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it('accepta un string llançat directament', () => {
    expect(getErrorMessage('aixo ha fallat')).toBe('aixo ha fallat');
  });

  it('ignora un string buit o només espais', () => {
    expect(getErrorMessage('   ')).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it('llegeix { message } d\'objectes que venen de respostes d\'API', () => {
    expect(getErrorMessage({ message: 'Token caducat' })).toBe('Token caducat');
  });

  it('ignora un { message } que no és string', () => {
    expect(getErrorMessage({ message: 42 })).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it('cau al text de reserva amb null, undefined i valors solts', () => {
    expect(getErrorMessage(null)).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(getErrorMessage(undefined)).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(getErrorMessage(42)).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(getErrorMessage({ codi: 500 })).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it('respecta el text de reserva contextual quan se li passa', () => {
    expect(getErrorMessage(null, 'Error en desar')).toBe('Error en desar');
    expect(getErrorMessage(new Error('real'), 'Error en desar')).toBe('real');
  });

  it('el defecte canònic és en català', () => {
    expect(UNKNOWN_ERROR_MESSAGE).toBe('Error desconegut');
  });
});
