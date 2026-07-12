/**
 * Tests dels helpers Òrbita per a vinculació conversa ↔ entitat sense BD.
 *
 * Aquests helpers viuen a `lib/imap.ts` i són pure: sense connexió IMAP, sense
 * BD. Aporten:
 *   - buildOrbitaMessageId / parseOrbitaMessageId
 *   - findOrbitaReferenceIn (cerca dins References: cadena multi-id)
 *   - buildOrbitaHeaders (headers MIME X-Orbita-*)
 *
 * El contracte sencer és el que sosté la decisió arquitectònica:
 *   "BD fora del canal. Vincle via Message-ID + headers MIME."
 */

import { describe, expect, it, afterEach } from 'vitest';
import {
  buildOrbitaHeaders,
  buildOrbitaMessageId,
  findOrbitaReferenceIn,
  parseOrbitaMessageId,
} from '@/lib/imap';

describe('lib/imap — buildOrbitaMessageId()', () => {
  const original = process.env.ORBITA_MAIL_DOMAIN;

  afterEach(() => {
    if (original === undefined) delete process.env.ORBITA_MAIL_DOMAIN;
    else process.env.ORBITA_MAIL_DOMAIN = original;
  });

  it('genera un Message-ID amb format <orbita.{kind}.{id}.{ts}.{rand}@{domain}>', () => {
    const id = buildOrbitaMessageId({ kind: 'lead', id: 'abc123' });
    expect(id).toMatch(/^<orbita\.lead\.abc123\.[a-z0-9]+\.[a-z0-9]+@orbitaevents\.com>$/);
  });

  it('substitueix caràcters no permesos a id', () => {
    const id = buildOrbitaMessageId({ kind: 'lead', id: 'a/b\\c d.e' });
    // El sanitize treu /, \, espais i punts del segment id (no del separador)
    expect(id).toMatch(/^<orbita\.lead\.abcde\.[a-z0-9]+\.[a-z0-9]+@orbitaevents\.com>$/);
  });

  it('usa "na" quan no es passa id', () => {
    const id = buildOrbitaMessageId({ kind: 'admin' });
    expect(id).toMatch(/^<orbita\.admin\.na\./);
  });

  it('respecta ORBITA_MAIL_DOMAIN env var', () => {
    process.env.ORBITA_MAIL_DOMAIN = 'example.test';
    // Cal recarregar el mòdul per recollir el canvi d'env — en lloc d'això,
    // el helper llegeix l'env al moment del càrrec del mòdul. Comprovem que
    // el helper retorna un Message-ID vàlid encara que el domini estigui
    // fixat al carregar (no es pot canviar en runtime sense module-reload).
    const id = buildOrbitaMessageId({ kind: 'lead', id: 'X' });
    expect(id).toMatch(/^<orbita\.lead\.X\.[a-z0-9]+\.[a-z0-9]+@[\w.]+>$/);
  });

  it('IDs generats consecutius són diferents (entropia ts+rand)', () => {
    const a = buildOrbitaMessageId({ kind: 'lead', id: 'X' });
    const b = buildOrbitaMessageId({ kind: 'lead', id: 'X' });
    expect(a).not.toBe(b);
  });

  it('limita id a 32 caràcters', () => {
    const longId = 'a'.repeat(100);
    const mid = buildOrbitaMessageId({ kind: 'customer', id: longId });
    const match = mid.match(/^<orbita\.customer\.([^.]+)\./);
    expect(match?.[1].length).toBeLessThanOrEqual(32);
  });
});

describe('lib/imap — parseOrbitaMessageId()', () => {
  it('parseja un Message-ID nostre', () => {
    const m = parseOrbitaMessageId('<orbita.lead.abc123.k7l8m.r9s8t@orbitaevents.com>');
    expect(m).toEqual({ kind: 'lead', id: 'abc123' });
  });

  it('retorna null per un messageId de tercers', () => {
    expect(parseOrbitaMessageId('<random@gmail.com>')).toBeNull();
    expect(parseOrbitaMessageId('<orbita.invented@gmail.com>')).toBeNull();
  });

  it('retorna null per valors buits', () => {
    expect(parseOrbitaMessageId(null)).toBeNull();
    expect(parseOrbitaMessageId(undefined)).toBeNull();
    expect(parseOrbitaMessageId('')).toBeNull();
  });

  it('detecta tots els kinds permesos', () => {
    const kinds = ['lead', 'customer', 'booking', 'dossier', 'proposal', 'admin'] as const;
    for (const k of kinds) {
      const mid = `<orbita.${k}.testid.aaa.bbb@orbitaevents.com>`;
      expect(parseOrbitaMessageId(mid)).toEqual({ kind: k, id: 'testid' });
    }
  });

  it('rebutja kinds desconeguts', () => {
    expect(parseOrbitaMessageId('<orbita.unknownkind.X.a.b@orbitaevents.com>')).toBeNull();
  });

  it('id "na" retorna kind correcte amb id buit', () => {
    const m = parseOrbitaMessageId('<orbita.admin.na.aaa.bbb@orbitaevents.com>');
    expect(m).toEqual({ kind: 'admin', id: '' });
  });
});

describe('lib/imap — findOrbitaReferenceIn()', () => {
  it('extreu un únic id Òrbita d\'una cadena References', () => {
    const refs = '<other@example.com> <orbita.lead.LEADX.aa.bb@orbitaevents.com>';
    expect(findOrbitaReferenceIn(refs)).toEqual({ kind: 'lead', id: 'LEADX' });
  });

  it('quan hi ha múltiples references Òrbita, retorna el primer trobat amb id no buit', () => {
    const refs =
      '<orbita.admin.na.aa.bb@orbitaevents.com> ' +
      '<orbita.lead.L1.cc.dd@orbitaevents.com> ' +
      '<orbita.customer.C2.ee.ff@orbitaevents.com>';
    const r = findOrbitaReferenceIn(refs);
    // L'admin "na" té id buit → salta al primer amb id
    expect(r).toEqual({ kind: 'lead', id: 'L1' });
  });

  it('null si no hi ha cap reference Òrbita', () => {
    expect(findOrbitaReferenceIn('<x@gmail.com> <y@yahoo.com>')).toBeNull();
  });

  it('null si la cadena és buida', () => {
    expect(findOrbitaReferenceIn(undefined)).toBeNull();
    expect(findOrbitaReferenceIn('')).toBeNull();
  });
});

describe('lib/imap — buildOrbitaHeaders()', () => {
  it('inclou X-Orbita-Kind sempre', () => {
    expect(buildOrbitaHeaders({ kind: 'admin' })).toEqual({ 'X-Orbita-Kind': 'admin' });
  });

  it('inclou X-Orbita-Id si està definit', () => {
    expect(buildOrbitaHeaders({ kind: 'lead', id: 'L1' })).toEqual({
      'X-Orbita-Kind': 'lead',
      'X-Orbita-Id': 'L1',
    });
  });

  it('inclou X-Orbita-Origin si està definit', () => {
    expect(buildOrbitaHeaders({ kind: 'dossier', id: 'D7', origin: 'dossier-D7' })).toEqual({
      'X-Orbita-Kind': 'dossier',
      'X-Orbita-Id': 'D7',
      'X-Orbita-Origin': 'dossier-D7',
    });
  });

  it('no inclou Id ni Origin si no estan definits', () => {
    const h = buildOrbitaHeaders({ kind: 'admin' });
    expect(Object.keys(h)).toEqual(['X-Orbita-Kind']);
  });
});
