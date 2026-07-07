import { describe, expect, it } from 'vitest';
import { shouldHidePublicMobileChrome } from '@/lib/constants/publicChrome';

describe('public mobile chrome rules', () => {
  it('oculta chrome mobil als fluxos publics focalitzats', () => {
    expect(shouldHidePublicMobileChrome('/configurador', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/contacto', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/reservar', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/valoracio', true)).toBe(true);
    expect(shouldHidePublicMobileChrome('/valoracio/gracies', true)).toBe(true);
  });

  it('manté chrome en desktop i en rutes publiques navegables', () => {
    expect(shouldHidePublicMobileChrome('/valoracio', false)).toBe(false);
    expect(shouldHidePublicMobileChrome('/servicios', true)).toBe(false);
    expect(shouldHidePublicMobileChrome('/valoracions', true)).toBe(false);
  });
});
