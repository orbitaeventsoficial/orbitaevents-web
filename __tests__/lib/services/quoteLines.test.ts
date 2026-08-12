import { describe, it, expect } from 'vitest';
import { buildQuoteLines } from '@/lib/services/quoteLines';

describe('el pressupost que llegeix el client', () => {
  it('el bolo desat en dues línies surt com una sola amb les hores', () => {
    const linies = buildQuoteLines([
      { kind: 'DJ', label: 'DJ · 1a hora', revenueAmount: 150, quantity: 1 },
      { kind: 'DJ', label: 'DJ · hora addicional', revenueAmount: 100, quantity: 2 },
    ]);
    expect(linies).toEqual([{ label: 'DJ · 3 hores', amount: 350 }]);
  });

  it('una hora sola també diu les hores', () => {
    const linies = buildQuoteLines([
      { kind: 'DJ', label: 'DJ · 1a hora', revenueAmount: 150, quantity: 1 },
    ]);
    expect(linies).toEqual([{ label: 'DJ · 1 hora', amount: 150 }]);
  });

  it('la 1a hora repetida per error no inventa hores de més', () => {
    // 150 + 100 + 150 = 400: no és cap nombre d'hores sencer.
    const linies = buildQuoteLines([
      { kind: 'DJ', label: 'DJ · 1a hora', revenueAmount: 150, quantity: 1 },
      { kind: 'DJ', label: 'DJ · hora addicional', revenueAmount: 100, quantity: 1 },
      { kind: 'DJ', label: 'DJ · 1a hora', revenueAmount: 150, quantity: 1 },
    ]);
    expect(linies.map((l) => l.label)).toEqual(['DJ · 1a hora', 'DJ · hora addicional', 'DJ · 1a hora']);
  });

  it('la resta de serveis es queden com són, darrere el DJ', () => {
    const linies = buildQuoteLines([
      { kind: 'EQUIPMENT', label: 'Màquina de bombolles', revenueAmount: 50, quantity: 1 },
      { kind: 'DJ', label: 'DJ · 1a hora', revenueAmount: 150, quantity: 1 },
      { kind: 'DJ', label: 'DJ · hora addicional', revenueAmount: 100, quantity: 1 },
    ]);
    expect(linies).toEqual([
      { label: 'DJ · 2 hores', amount: 250 },
      { label: 'Màquina de bombolles', amount: 50 },
    ]);
  });

  it('sense DJ, el pressupost no canvia', () => {
    const linies = buildQuoteLines([
      { kind: 'PROVIDER_SERVICE', label: 'Bingo Musical', revenueAmount: 400, quantity: 1 },
    ]);
    expect(linies).toEqual([{ label: 'Bingo Musical', amount: 400 }]);
  });
});
