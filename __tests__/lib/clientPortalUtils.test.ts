import { describe, expect, it } from 'vitest';
import {
  coercePortalPersonalization,
  normalizePortalAccentHex,
  readPortalActionError,
  resolvePortalAccentHex,
  toRgba,
} from '@/lib/clientPortalUtils';
import { CLIENT_PORTAL_DEFAULT_ACCENT_COLOR } from '@/lib/constants/clientPortalPersonalization';

describe('clientPortalUtils', () => {
  it('normalitza el color accent abans de guardar-lo', () => {
    expect(normalizePortalAccentHex(' abc ')).toBe('#abc');
    expect(normalizePortalAccentHex('06b6d4')).toBe('#06b6d4');
    expect(normalizePortalAccentHex('#1234')).toBeUndefined();
    expect(normalizePortalAccentHex(null)).toBeUndefined();
  });

  it('resol el color accent nomes amb hex de 3 o 6 digits', () => {
    expect(resolvePortalAccentHex({ accentColor: ' abc ' })).toBe('#abc');
    expect(resolvePortalAccentHex({ accentColor: '06b6d4' })).toBe('#06b6d4');
    expect(resolvePortalAccentHex({ accentColor: '#06b6d4' })).toBe('#06b6d4');
    expect(resolvePortalAccentHex({ accentColor: '12345' })).toBe(CLIENT_PORTAL_DEFAULT_ACCENT_COLOR);
    expect(resolvePortalAccentHex({ accentColor: '#1234' })).toBe(CLIENT_PORTAL_DEFAULT_ACCENT_COLOR);
  });

  it('coacciona la personalitzacio JSON abans de llegir-la al portal', () => {
    expect(coercePortalPersonalization({
      headline: 123,
      introMessage: '  Benvingut  ',
      accentColor: '06b6d4',
      showPayments: false,
      showTimeline: 'false',
    })).toEqual({
      headline: undefined,
      introMessage: '  Benvingut  ',
      accentColor: '#06b6d4',
      showTimeline: undefined,
      showPayments: false,
      showDocuments: undefined,
      showPostEvent: undefined,
      showQuestionnaire: undefined,
    });
  });

  it('converteix a rgba nomes hex valid de 3 o 6 digits', () => {
    expect(toRgba('#06b6d4', 0.5)).toBe('rgba(6, 182, 212, 0.5)');
    expect(toRgba('#abc', 0.25)).toBe('rgba(170, 187, 204, 0.25)');
    expect(toRgba('#1234', 0.5)).toBeNull();
  });

  it('llegeix errors de resposta nomes des dobjectes JSON', () => {
    expect(readPortalActionError({ error: 'ALREADY_SIGNED' })).toBe('ALREADY_SIGNED');
    expect(readPortalActionError(null)).toBeUndefined();
    expect(readPortalActionError(['ALREADY_SIGNED'])).toBeUndefined();
  });
});
