import { describe, expect, it } from 'vitest';
import {
  getCoverageAreaMutationKey,
  isCoverageAreaMutationPending,
  readCoverageApiError,
} from '@/app/admin/coverage/coverage-utils';

describe('readCoverageApiError', () => {
  it('prioritza error i message del payload', () => {
    expect(readCoverageApiError({ error: 'Ciutat duplicada', message: 'Fallback backend' }, 'Fallback local')).toBe('Ciutat duplicada');
    expect(readCoverageApiError({ message: 'No autoritzat' }, 'Fallback local')).toBe('No autoritzat');
  });

  it('retorna fallback si el payload no porta missatge usable', () => {
    expect(readCoverageApiError({ error: '' }, 'Fallback local')).toBe('Fallback local');
    expect(readCoverageApiError(null, 'Fallback local')).toBe('Fallback local');
  });
});

describe('coverage area mutation keys', () => {
  it('identifica laccio pendent per ciutat i tipus', () => {
    const pending = getCoverageAreaMutationKey('toggle', 'Barcelona');

    expect(isCoverageAreaMutationPending(pending, 'toggle', 'Barcelona')).toBe(true);
    expect(isCoverageAreaMutationPending(pending, 'remove', 'Barcelona')).toBe(false);
    expect(isCoverageAreaMutationPending(pending, 'toggle', 'Girona')).toBe(false);
  });
});
