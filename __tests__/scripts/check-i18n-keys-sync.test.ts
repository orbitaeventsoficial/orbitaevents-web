// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-i18n-keys-sync.mjs');

function runGuard(locales: Record<string, object>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-i18n-sync-'));
  const messagesDir = path.join(root, 'messages');
  mkdirSync(messagesDir, { recursive: true });
  for (const [locale, content] of Object.entries(locales)) {
    writeFileSync(path.join(messagesDir, `${locale}.json`), JSON.stringify(content), 'utf8');
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

const SYNCED = {
  ca: { nav: { home: 'Inici', about: 'Sobre nosaltres' }, footer: { contact: 'Contacte' } },
  es: { nav: { home: 'Inicio', about: 'Sobre nosotros' }, footer: { contact: 'Contacto' } },
  en: { nav: { home: 'Home', about: 'About us' }, footer: { contact: 'Contact' } },
};

describe('check-i18n-keys-sync', () => {
  it('passa quan tots els fitxers tenen les mateixes claus', () => {
    const result = runGuard(SYNCED);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[i18n-keys-sync] OK');
  });

  it('falla quan ca té una clau que falta a es i en', () => {
    const result = runGuard({
      ca: { nav: { home: 'Inici', about: 'Sobre nosaltres', extra: 'Addicional' }, footer: { contact: 'Contacte' } },
      es: { nav: { home: 'Inicio', about: 'Sobre nosotros' }, footer: { contact: 'Contacto' } },
      en: { nav: { home: 'Home', about: 'About us' }, footer: { contact: 'Contact' } },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[i18n-keys-sync] FAIL');
    expect(result.stderr).toContain('"nav.extra"');
    expect(result.stderr).toContain('es');
    expect(result.stderr).toContain('en');
  });

  it('falla quan es té una clau que falta a ca i en', () => {
    const result = runGuard({
      ca: { greet: 'Hola' },
      es: { greet: 'Hola', extra: 'Extra' },
      en: { greet: 'Hello' },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"extra"');
    expect(result.stderr).toContain('ca');
    expect(result.stderr).toContain('en');
  });

  it('falla quan en té un subnamespace que falta als altres', () => {
    const result = runGuard({
      ca: { a: { x: '1' } },
      es: { a: { x: '1' } },
      en: { a: { x: '1', y: '2' } },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"a.y"');
    expect(result.stderr).toContain('ca');
    expect(result.stderr).toContain('es');
  });

  it('informa del nombre total de claus quan passa', () => {
    const result = runGuard(SYNCED);
    expect(result.stdout).toContain('3 claus');
  });

  it('tracta arrays com a valors fulla, no recursiva', () => {
    const result = runGuard({
      ca: { items: ['a', 'b'] },
      es: { items: ['c', 'd'] },
      en: { items: ['e', 'f'] },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[i18n-keys-sync] OK');
  });

  it('permet el drift legacy documentat mentre bloqueja claus noves fora del baseline', () => {
    const result = runGuard({
      ca: {
        footerLinks: { legal: { avisoLegal: { title: 'Avís legal' } } },
        experiences: { cta: { badge: 'Nou' } },
        shared: { ok: 'Correcte' },
      },
      es: { testimonials: { quote: 'Texto' }, shared: { ok: 'Correcto' } },
      en: { testimonials: { quote: 'Text' }, shared: { ok: 'Correct' } },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[i18n-keys-sync] OK');
  });
});
