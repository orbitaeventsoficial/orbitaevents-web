import { describe, expect, it } from 'vitest';
import {
  indexProtocolCanvisByNumber,
  indexProtocolSectionsById,
  parseProtocolCanvis,
  parseProtocolSections,
} from '@/lib/services/protocolCanvisService';

describe('parseProtocolCanvis', () => {
  it('retorna array buit per input buit', () => {
    expect(parseProtocolCanvis('')).toEqual([]);
    expect(parseProtocolCanvis('## Sense canvis')).toEqual([]);
  });

  it('extreu metadades canòniques de cada Canvi #N', () => {
    const md = [
      '## §9',
      '',
      '### Canvi #462 — 2026-04-30 — claude (FET)',
      '**Roadmap sincronitzat amb la realitat del §6.15.**',
      '- Començat per: `claude`',
      '- Treballant per: `claude`',
      '',
      '### Canvi #461 — 2026-04-30 — codex (FET)',
      '**Inbox multi-canal.**',
      '- Començat per: `codex`',
    ].join('\n');

    const canvis = parseProtocolCanvis(md);
    expect(canvis).toHaveLength(2);
    expect(canvis[0]).toMatchObject({
      n: 462,
      date: '2026-04-30',
      author: 'claude',
      status: 'FET',
      headline: 'Roadmap sincronitzat amb la realitat del §6.15.',
      anchorId: 'canvi-462',
    });
    expect(canvis[0]?.body).toContain('Començat per: `claude`');
    expect(canvis[1]).toMatchObject({ n: 461, author: 'codex' });
  });

  it('captura tot el body del Canvi fins al següent header', () => {
    const md = [
      '### Canvi #100 — 2026-01-01 — claude (FET)',
      '**Headline 100.**',
      '- bullet a',
      '- bullet b',
      '',
      'Paràgraf intermedi.',
      '',
      '### Canvi #99 — 2025-12-31 — codex (FET)',
      '**Headline 99.**',
    ].join('\n');

    const canvis = parseProtocolCanvis(md);
    expect(canvis[0]?.body).toContain('Paràgraf intermedi');
    expect(canvis[0]?.body).not.toContain('### Canvi #99');
  });

  it('normalitza estats canònics i marca UNKNOWN els no canònics', () => {
    const md = [
      '### Canvi #1 — 2026-01-01 — claude (FET)',
      '**A.**',
      '### Canvi #2 — 2026-01-02 — claude (en marxa)',
      '**B.**',
      '### Canvi #3 — 2026-01-03 — claude (PENDENT)',
      '**C.**',
      '### Canvi #4 — 2026-01-04 — claude (RARO)',
      '**D.**',
    ].join('\n');

    const canvis = parseProtocolCanvis(md);
    expect(canvis.map((c) => c.status)).toEqual(['FET', 'EN MARXA', 'PENDENT', 'UNKNOWN']);
  });

  it('normalitza estats canònics encara que el header porti context extra de col·lisió o reclassificació', () => {
    const md = [
      '### Canvi #489 — 2026-05-04 — claude (FET; reclassificat des de #487 per col·lisió de comptador)',
      '**A.**',
      '### Canvi #490 — 2026-05-04 — codex (EN MARXA; reservat mentre valida)',
      '**B.**',
      '### Canvi #491 — 2026-05-04 — codex (PENDENT temporal fins al registre final)',
      '**C.**',
    ].join('\n');

    const canvis = parseProtocolCanvis(md);
    expect(canvis.map((c) => c.status)).toEqual(['FET', 'EN MARXA', 'PENDENT']);
  });

  it('ignora headers que no siguin "### Canvi #N — DATE — AUTHOR (STATUS)"', () => {
    const md = [
      '### Canvi 462 — 2026-04-30 — claude (FET)',
      '### Canvi # — 2026-04-30 — claude (FET)',
      '### Canvi #abc — 2026-04-30 — claude (FET)',
      '### Canvi #462 sense data',
      '### Canvi #462 — 2026-04-30 (FET)',
    ].join('\n');

    expect(parseProtocolCanvis(md)).toEqual([]);
  });

  it('preserva l\'ordre d\'aparició al document (el §9 va de més recent a més antic)', () => {
    const md = [
      '### Canvi #50 — 2026-04-15 — claude (FET)',
      '**A.**',
      '### Canvi #45 — 2026-04-10 — codex (FET)',
      '**B.**',
      '### Canvi #1 — 2026-01-01 — claude (FET)',
      '**C.**',
    ].join('\n');

    const canvis = parseProtocolCanvis(md);
    expect(canvis.map((c) => c.n)).toEqual([50, 45, 1]);
  });
});

describe('parseProtocolSections', () => {
  it('retorna array buit per input buit o sense ## headers', () => {
    expect(parseProtocolSections('')).toEqual([]);
    expect(parseProtocolSections('Sense headers de secció.')).toEqual([]);
    expect(parseProtocolSections('### Canvi #1 — 2026-04-30 — claude (FET)\n**Body.**')).toEqual([]);
  });

  it('extreu cada ## §X.Y Title amb anchorId derivat de l\'id', () => {
    const md = [
      '## 6.15 Roadmap de millores identificades',
      '**FET**: tot llest.',
      '',
      '## 6.16 Màrqueting i captació',
      '**EN MARXA**: Fase 0.',
    ].join('\n');

    const sections = parseProtocolSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({
      id: '6.15',
      title: 'Roadmap de millores identificades',
      anchorId: 'seccio-6-15',
    });
    expect(sections[0]?.body).toContain('**FET**: tot llest.');
    expect(sections[1]?.id).toBe('6.16');
    expect(sections[1]?.anchorId).toBe('seccio-6-16');
  });

  it('captura el body fins al següent ## header', () => {
    const md = [
      '## 6.15 Roadmap',
      'Línia 1.',
      'Línia 2.',
      '',
      'Paràgraf intermedi.',
      '',
      '## 6.16 Màrqueting',
      'Body següent.',
    ].join('\n');

    const sections = parseProtocolSections(md);
    expect(sections[0]?.body).toContain('Línia 1.');
    expect(sections[0]?.body).toContain('Paràgraf intermedi.');
    expect(sections[0]?.body).not.toContain('## 6.16');
    expect(sections[0]?.body).not.toContain('Body següent.');
  });

  it('ignora ### Canvi #N (només extreu ## headers)', () => {
    const md = [
      '## 9 Registre de canvis',
      'Header de §9.',
      '',
      '### Canvi #463 — 2026-04-30 — claude (FET)',
      '**No és secció.**',
    ].join('\n');

    const sections = parseProtocolSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.id).toBe('9');
  });

  it('soporta ids multi-nivell (X.Y, X.Y.Z)', () => {
    const md = [
      '## 2.1.0 Característiques',
      'Body 2.1.0.',
      '## 6.18 CRMs',
      'Body 6.18.',
    ].join('\n');

    const sections = parseProtocolSections(md);
    expect(sections.map((s) => s.id)).toEqual(['2.1.0', '6.18']);
    expect(sections[0]?.anchorId).toBe('seccio-2-1-0');
  });
});

describe('indexProtocolSectionsById', () => {
  it('exposa Map amb lookup O(1) per id (string)', () => {
    const md = [
      '## 6.15 Roadmap',
      'Body 1.',
      '## 6.16 Marketing',
      'Body 2.',
    ].join('\n');

    const index = indexProtocolSectionsById(parseProtocolSections(md));
    expect(index.size).toBe(2);
    expect(index.get('6.15')?.title).toBe('Roadmap');
    expect(index.get('6.16')?.title).toBe('Marketing');
    expect(index.get('9.99')).toBeUndefined();
  });
});

describe('indexProtocolCanvisByNumber', () => {
  it('exposa Map amb lookup O(1) per Canvi #N', () => {
    const md = [
      '### Canvi #462 — 2026-04-30 — claude (FET)',
      '**A.**',
      '### Canvi #115 — 2026-04-12 — claude (FET)',
      '**B.**',
    ].join('\n');

    const index = indexProtocolCanvisByNumber(parseProtocolCanvis(md));
    expect(index.size).toBe(2);
    expect(index.get(462)?.author).toBe('claude');
    expect(index.get(115)?.headline).toBe('B.');
    expect(index.get(999)).toBeUndefined();
  });
});
