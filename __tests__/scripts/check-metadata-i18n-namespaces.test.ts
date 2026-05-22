// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-metadata-i18n-namespaces.mjs');

function buildMessages(ca: object, es: object, en: object) {
  return { ca, es, en };
}

function runGuard(
  messages: Record<string, object>,
  pages: Record<string, string> = {},
) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-meta-i18n-'));
  const messagesDir = path.join(root, 'messages');
  mkdirSync(messagesDir, { recursive: true });
  for (const [locale, content] of Object.entries(messages)) {
    writeFileSync(path.join(messagesDir, `${locale}.json`), JSON.stringify(content), 'utf8');
  }

  const localeDir = path.join(root, 'app', '[locale]');
  mkdirSync(localeDir, { recursive: true });
  for (const [filename, content] of Object.entries(pages)) {
    const filePath = path.join(localeDir, filename);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf8');
  }

  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

const FULL_JSON = {
  common: { nav: { home: 'Inici' } },
  homePage: { meta: { title: 'Pàgina principal' } },
  services: { bodas: { meta: { title: 'Bodes' } } },
};

describe('check-metadata-i18n-namespaces', () => {
  it('passa quan tots els namespaces existeixen en tots els locales', () => {
    const result = runGuard(
      buildMessages(FULL_JSON, FULL_JSON, FULL_JSON),
      {
        'page.tsx': `export async function generateMetadata({ params }) {
          const t = await getTranslations({ locale, namespace: 'homePage' });
          const t2 = await getTranslations({ locale, namespace: 'common' });
        }`,
      },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[metadata-i18n-namespaces] OK');
  });

  it('falla quan un namespace falta a es', () => {
    const esJson = { common: { nav: { home: 'Inicio' } } };
    const result = runGuard(
      buildMessages(FULL_JSON, esJson, FULL_JSON),
      {
        'page.tsx': `const t = await getTranslations({ locale, namespace: 'homePage' });`,
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[metadata-i18n-namespaces] FAIL');
    expect(result.stderr).toContain('"homePage"');
    expect(result.stderr).toContain('es');
  });

  it('falla quan un namespace de ruta aniuada falta a en', () => {
    const enJson = { common: { nav: { home: 'Home' } }, homePage: { meta: { title: 'Home' } } };
    const result = runGuard(
      buildMessages(FULL_JSON, FULL_JSON, enJson),
      {
        'servicios/bodas/page.tsx': `const t = await getTranslations({ locale, namespace: 'services.bodas' });`,
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"services.bodas"');
    expect(result.stderr).toContain('en');
  });

  it('no falla per fitxers sense getTranslations', () => {
    const result = runGuard(
      buildMessages(FULL_JSON, FULL_JSON, FULL_JSON),
      { 'page.tsx': `export default function Page() { return <div>Hello</div>; }` },
    );
    expect(result.status).toBe(0);
  });

  it('reporta múltiples namespaces absents', () => {
    const minJson = { common: { nav: { home: 'Home' } } };
    const result = runGuard(
      buildMessages(FULL_JSON, minJson, minJson),
      {
        'page.tsx': `
          const t1 = await getTranslations({ locale, namespace: 'homePage' });
          const t2 = await getTranslations({ locale, namespace: 'services.bodas' });
        `,
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"homePage"');
    expect(result.stderr).toContain('"services.bodas"');
  });

  it('passa quan no hi ha fitxers a app/[locale]', () => {
    const result = runGuard(buildMessages(FULL_JSON, FULL_JSON, FULL_JSON), {});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('0 namespace(s)');
  });
});
