import { describe, expect, it } from 'vitest';
import {
  formatClientPortalEventPlace,
  formatClientPortalGuestCount,
  getClientPortalFirstName,
  getClientPortalPersonalizedText,
} from '@/lib/clientPortalEventDisplay';

describe('formatClientPortalEventPlace', () => {
  it('uneix nomes les parts reals de la ubicacio del portal', () => {
    expect(formatClientPortalEventPlace('Masia Can Riera', 'Granollers')).toBe(
      'Masia Can Riera · Granollers',
    );
    expect(formatClientPortalEventPlace('Masia Can Riera', '')).toBe('Masia Can Riera');
    expect(formatClientPortalEventPlace('  ', 'Granollers')).toBe('Granollers');
    expect(formatClientPortalEventPlace(null, undefined)).toBe('');
  });

  it('formata el recompte de convidats amb singular i plural localitzats', () => {
    expect(formatClientPortalGuestCount('ca', 1)).toBe('1 convidat');
    expect(formatClientPortalGuestCount('ca', 2)).toBe('2 convidats');
    expect(formatClientPortalGuestCount('es', 1)).toBe('1 invitado');
    expect(formatClientPortalGuestCount('en', 2)).toBe('2 guests');
  });

  it('extreu el primer nom del client despres de sanejar espais', () => {
    expect(getClientPortalFirstName('  Maria   Garcia  ')).toBe('Maria');
    expect(getClientPortalFirstName('Pau')).toBe('Pau');
    expect(getClientPortalFirstName('   ')).toBe('');
    expect(getClientPortalFirstName(null)).toBe('');
  });

  it('fa fallback si el text personalitzat del portal es buit', () => {
    expect(getClientPortalPersonalizedText('  Hola Maria  ', 'Fallback')).toBe('Hola Maria');
    expect(getClientPortalPersonalizedText('   ', 'Fallback')).toBe('Fallback');
    expect(getClientPortalPersonalizedText(null, 'Fallback')).toBe('Fallback');
  });
});
