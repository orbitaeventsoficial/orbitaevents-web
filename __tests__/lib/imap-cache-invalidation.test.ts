import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard estructural: les mutacions IMAP (markAsRead, markAsUnread, deleteEmail,
 * moveToFolder) han d'invalidar `FETCH_EMAIL_CACHE` després de l'operació
 * exitosa. Sense això, el cache LRU del `#499` retorna entrades stale:
 *
 * - Marcar un mail llegit → cache torna `isRead: false` al següent open.
 * - Esborrar un mail → cache encara el serveix com si existís.
 * - Moure un mail a una altra carpeta → cache té UID a sourceFolder però el
 *   mail real ja no hi és.
 *
 * Aquest test no mocka res. Llegeix el fitxer real i verifica que cada
 * mutació té una crida `invalidateFetchEmailCache(uid, folder)` dins del
 * cos de la funció. Forat del `#499` (deute documentat) tancat al `#507`.
 */
describe('lib/imap.ts — mutacions IMAP invaliden FETCH_EMAIL_CACHE', () => {
  const imapSource = readFileSync(join(process.cwd(), 'lib', 'imap.ts'), 'utf8');

  function extractFunction(name: string): string {
    const startMarker = `export async function ${name}`;
    const startIdx = imapSource.indexOf(startMarker);
    if (startIdx === -1) {
      throw new Error(`Funció ${name} no trobada a lib/imap.ts`);
    }
    let depth = 0;
    let i = imapSource.indexOf('{', startIdx);
    if (i === -1) throw new Error(`Cos de ${name} no trobat`);
    const bodyStart = i;
    for (; i < imapSource.length; i++) {
      const ch = imapSource[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return imapSource.slice(bodyStart, i + 1);
      }
    }
    throw new Error(`Tancament de ${name} no trobat`);
  }

  it('markAsRead invalida el cache després de marcar el flag \\Seen', () => {
    const body = extractFunction('markAsRead');
    expect(body).toMatch(/messageFlagsAdd\([^)]*\\\\Seen[^)]*\)/);
    expect(body).toMatch(/invalidateFetchEmailCache\(\s*uid\s*,\s*folder\s*\)/);
  });

  it('markAsUnread invalida el cache després de retirar el flag \\Seen', () => {
    const body = extractFunction('markAsUnread');
    expect(body).toMatch(/messageFlagsRemove\([^)]*\\\\Seen[^)]*\)/);
    expect(body).toMatch(/invalidateFetchEmailCache\(\s*uid\s*,\s*folder\s*\)/);
  });

  it('deleteEmail invalida el cache tant al delete directe com al fallback move-to-trash', () => {
    const body = extractFunction('deleteEmail');
    const matches = body.match(/invalidateFetchEmailCache\(\s*uid\s*,\s*folder\s*\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('moveToFolder invalida el cache de la carpeta origen (no la destí)', () => {
    const body = extractFunction('moveToFolder');
    expect(body).toMatch(/messageMove\(/);
    expect(body).toMatch(/invalidateFetchEmailCache\(\s*uid\s*,\s*sourceFolder\s*\)/);
  });

  it('invalidateFetchEmailCache continua exportada (consumidors interns la fan servir)', () => {
    expect(imapSource).toMatch(/export function invalidateFetchEmailCache/);
  });
});
