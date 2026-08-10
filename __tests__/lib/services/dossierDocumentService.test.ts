import { describe, expect, it } from 'vitest';

import { parseLineSnapshot } from '@/lib/services/dossierDocumentService';

/**
 * La foto del bolo desada amb el dossier.
 *
 * Existeix perquè el servidor pugui refer exactament el document que s'ha vist
 * a la pantalla. Si aquesta lectura s'equivoca, el client rep un dossier amb
 * altres preus —o sense— i ningú se n'assabenta fins que ja ha sortit de casa.
 *
 * La columna ve d'una base de dades viva i és `Json?`: pot portar qualsevol
 * cosa, inclòs el que hi va deixar una versió anterior. Per això la lectura ha
 * de sobreviure a l'escombraria sense inventar-se números.
 */
describe('parseLineSnapshot', () => {
  it('llegeix quilòmetres i línies de preu', () => {
    expect(parseLineSnapshot({
      travelKm: 70,
      lines: [{ label: 'DJ · 5 hores', amount: 450 }],
    })).toEqual({
      travelKm: 70,
      lines: [{ label: 'DJ · 5 hores', amount: 450 }],
    });
  });

  it('no inventa res quan la columna és buida', () => {
    expect(parseLineSnapshot(null)).toEqual({ travelKm: undefined, lines: undefined });
    expect(parseLineSnapshot(undefined)).toEqual({ travelKm: undefined, lines: undefined });
    expect(parseLineSnapshot('{}')).toEqual({ travelKm: undefined, lines: undefined });
    expect(parseLineSnapshot([1, 2])).toEqual({ travelKm: undefined, lines: undefined });
  });

  it('descarta els quilòmetres que no són un número positiu', () => {
    expect(parseLineSnapshot({ travelKm: 0 }).travelKm).toBeUndefined();
    expect(parseLineSnapshot({ travelKm: -5 }).travelKm).toBeUndefined();
    expect(parseLineSnapshot({ travelKm: 'setanta' }).travelKm).toBeUndefined();
  });

  it('descarta les línies sense text o sense import, i conserva la resta', () => {
    expect(parseLineSnapshot({
      lines: [
        { label: 'Bones', amount: 100 },
        { label: '', amount: 50 },
        { label: 'Sense import', amount: 'molt' },
        null,
      ],
    }).lines).toEqual([{ label: 'Bones', amount: 100 }]);
  });

  it('deixa les línies indefinides quan cap sobreviu, i no una llista buida', () => {
    // Una llista buida i «no hi ha llista» han de dir el mateix riu avall:
    // el constructor del document decideix pintar el pressupost o no segons
    // si això és `undefined`.
    expect(parseLineSnapshot({ lines: [{ label: '', amount: 1 }] }).lines).toBeUndefined();
  });
});
