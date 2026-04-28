import { afterEach, describe, expect, it, vi } from 'vitest';
import { shuffle } from '@/lib/utils/shuffle';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('shuffle', () => {
  it('retorna un array nou (no muta l\'original)', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);
    expect(result).not.toBe(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it('preserva longitud i elements (només canvia ordre)', () => {
    const original = ['a', 'b', 'c', 'd', 'e'];
    const result = shuffle(original);
    expect(result).toHaveLength(original.length);
    expect([...result].sort()).toEqual([...original].sort());
  });

  it('amb Math.random determinista produeix ordre Fisher-Yates esperat', () => {
    // Amb random=0, j sempre val 0 → Fisher-Yates inverteix el primer
    // amb cada element a posició final, fent un patró determinista.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = shuffle([1, 2, 3, 4]);
    // i=3,j=0 → swap(3,0): [4,2,3,1]
    // i=2,j=0 → swap(2,0): [3,2,4,1]
    // i=1,j=0 → swap(1,0): [2,3,4,1]
    expect(result).toEqual([2, 3, 4, 1]);
  });

  it('array buit retorna nou array buit', () => {
    const empty: number[] = [];
    const result = shuffle(empty);
    expect(result).toEqual([]);
    expect(result).not.toBe(empty);
  });

  it('array d\'un sol element retorna nou array amb el mateix element', () => {
    const single = [42];
    const result = shuffle(single);
    expect(result).toEqual([42]);
    expect(result).not.toBe(single);
  });

  it('accepta readonly array sense que el tipus rebenti', () => {
    const readOnly: readonly number[] = [1, 2, 3];
    const result = shuffle(readOnly);
    expect(result).toHaveLength(3);
  });
});
