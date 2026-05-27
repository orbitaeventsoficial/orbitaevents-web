import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard estructural: la funció `fetchEmailByUid` de `lib/imap.ts` NO pot tornar
 * a usar `source: true` perquè això descarrega l'RFC822 sencer incloent
 * attachments en base64. Un mail amb un PDF de 2MB es converteix en ~2.7MB
 * de transferència base64, provocant timeouts >25s i 502 a Railway.
 *
 * Solució correcta (post-#821): demanar `bodyParts` específics. ImapFlow
 * normalitza les claus a lowercase i les numera segons el bodyStructure
 * (1, 2, 1.1, 1.2...). Decodifiquem manualment quoted-printable/base64
 * via `decodePartBody` i `identifyTextParts`.
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

  it('fetchEmailByUid usa bodyParts amb keys lowercase (header) i parts numerades', () => {
    const body = extractFunction('fetchEmailByUid');
    // bodyParts pot ser inline (`[...]`) o via variable (`DEFAULT_PARTS`)
    expect(body).toMatch(/bodyParts\s*:\s*(\[|[A-Z_][A-Z0-9_]*)/);
    // ImapFlow normalitza les keys a lowercase
    expect(body).toContain("'header'");
    // Demanem parts numerades genèriques per cobrir multipart/alternative
    expect(body).toMatch(/'1'/);
    expect(body).toMatch(/'2'/);
  });

  it("fetchEmailByUid llegeix bodyParts.get('header') (lowercase) i passa per identifyTextParts", () => {
    const body = extractFunction('fetchEmailByUid');
    expect(body).toMatch(/bodyParts\?\.get\(['"]header['"]\)/);
    // El descobriment de parts text passa per identifyTextParts (no per get
    // directe de 'TEXT' que tornaria buit en multipart)
    expect(body).toContain('identifyTextParts');
    expect(body).toContain('decodePartBody');
  });
});
