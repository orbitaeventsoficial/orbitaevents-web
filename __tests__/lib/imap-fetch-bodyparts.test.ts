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

  it('fetchEmailByUid demana NOMÉS les parts que el missatge té', () => {
    const body = extractFunction('fetchEmailByUid');

    // Aquest test demanava el contrari fins al 2026-07-27: exigia que es
    // demanessin sempre les parts '1' i '2' «per cobrir multipart». La premissa
    // era que el servidor tornaria null per a les parts que no existissin.
    //
    // Producció la va desmentir: DonDominio fa fallar TOTA l'ordre amb
    // «Command failed» si li demanes una part inexistent, i per això no es
    // podia llegir el cos de CAP correu de la safata. Cap missatge té alhora
    // '1', '2', '3', '1.1', '1.2', '1.3', '2.1' i '2.2'.
    //
    // La invariant bona: preguntar primer l'estructura i demanar després.
    expect(body).toMatch(/bodyParts\s*:\s*(\[|[A-Za-z_$][\w$]*)/);
    expect(body).toContain("'header'");

    // L'estructura es consulta ABANS de demanar les parts.
    expect(body).toMatch(/bodyStructure:\s*true/);
    expect(body).toContain('identifyTextParts');

    // I no es tornen a demanar parts numerades a l'atzar.
    expect(body).not.toMatch(/bodyParts\s*:\s*\[[^\]]*'2\.2'/);
    expect(body).not.toMatch(/bodyParts\s*:\s*\[[^\]]*'1\.3'/);
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
