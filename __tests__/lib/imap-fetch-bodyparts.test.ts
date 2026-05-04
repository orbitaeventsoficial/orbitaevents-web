import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard estructural: la funció `fetchEmailByUid` de `lib/imap.ts` NO pot tornar
 * a usar `source: true` perquè això descarrega l'RFC822 sencer incloent
 * attachments en base64. Un mail amb un PDF de 2MB es converteix en ~2.7MB
 * de transferència base64, provocant timeouts >25s i 502 a Railway.
 *
 * Solució correcta: `bodyParts: ['HEADER', 'TEXT']` que salta attachments.
 *
 * Aquest test no mocka res. Llegeix el fitxer real i verifica el patró.
 */
describe('lib/imap.ts — fetchEmailByUid no pot regressionar a source: true', () => {
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

  it('fetchEmailByUid no descarrega el RFC822 sencer (source: true prohibit)', () => {
    const body = extractFunction('fetchEmailByUid');
    expect(body).not.toMatch(/source\s*:\s*true/);
  });

  it('fetchEmailByUid usa bodyParts per descarregar només HEADER+TEXT', () => {
    const body = extractFunction('fetchEmailByUid');
    expect(body).toMatch(/bodyParts\s*:\s*\[/);
    expect(body).toContain("'HEADER'");
    expect(body).toContain("'TEXT'");
  });

  it("fetchEmailByUid llegeix bodyParts.get('HEADER') i bodyParts.get('TEXT')", () => {
    const body = extractFunction('fetchEmailByUid');
    expect(body).toMatch(/bodyParts\?\.get\(['"]HEADER['"]\)/);
    expect(body).toMatch(/bodyParts\?\.get\(['"]TEXT['"]\)/);
  });
});
