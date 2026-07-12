import { describe, expect, it } from 'vitest';
import { pluralize } from '@/lib/utils/pluralize';

describe('pluralize', () => {
  it('retorna singular quan count és 1', () => {
    expect(pluralize(1, 'pack', 'packs')).toBe('pack');
  });

  it('retorna plural per count 0', () => {
    expect(pluralize(0, 'pack', 'packs')).toBe('packs');
  });

  it('retorna plural per count 2+', () => {
    expect(pluralize(2, 'pack', 'packs')).toBe('packs');
    expect(pluralize(99, 'pack', 'packs')).toBe('packs');
  });

  it('funciona amb formes catalanes irregulars', () => {
    expect(pluralize(1, 'entrada', 'entrades')).toBe('entrada');
    expect(pluralize(3, 'entrada', 'entrades')).toBe('entrades');
    expect(pluralize(1, 'ressenya pendent', 'ressenyes pendents')).toBe('ressenya pendent');
    expect(pluralize(5, 'ressenya pendent', 'ressenyes pendents')).toBe('ressenyes pendents');
  });

  it('accepta strings buits per casos de sufix (plural s o res)', () => {
    expect(pluralize(1, '', 's')).toBe('');
    expect(pluralize(4, '', 's')).toBe('s');
  });
});
