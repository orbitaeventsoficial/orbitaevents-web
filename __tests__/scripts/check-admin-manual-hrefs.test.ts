// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { extractAdminHrefs, routeFileExists } from '../../scripts/check-admin-manual-hrefs.mjs';

const scriptPath = path.resolve('scripts/check-admin-manual-hrefs.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-admin-hrefs-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

// — extractAdminHrefs —

describe('extractAdminHrefs', () => {
  it('extreu un adminHref simple', () => {
    const src = `adminHref: '/admin/leads'`;
    expect(extractAdminHrefs(src)).toEqual(new Set(['/admin/leads']));
  });

  it('extreu un href d\'admin simple', () => {
    const src = `href: '/admin/clients'`;
    expect(extractAdminHrefs(src)).toEqual(new Set(['/admin/clients']));
  });

  it('ignora hrefs que no comencen per /admin/', () => {
    const src = `href: '/public/home', adminHref: '/admin/dashboard'`;
    expect(extractAdminHrefs(src)).toEqual(new Set(['/admin/dashboard']));
  });

  it('ignora query strings i fragments', () => {
    const src = `adminHref: '/admin/leads?status=open', href: '/admin/clients#top'`;
    expect(extractAdminHrefs(src)).toEqual(new Set(['/admin/leads', '/admin/clients']));
  });

  it('deduplicates hrefs repetits', () => {
    const src = `adminHref: '/admin/leads'\nadminHref: '/admin/leads'`;
    expect(extractAdminHrefs(src)).toEqual(new Set(['/admin/leads']));
  });

  it('retorna un Set buit si no hi ha hrefs d\'admin', () => {
    const src = `href: '/public/home'`;
    expect(extractAdminHrefs(src).size).toBe(0);
  });
});

// — routeFileExists —

describe('routeFileExists', () => {
  it('retorna true quan existeix page.tsx', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-route-'));
    const dir = path.join(root, 'admin', 'leads');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'page.tsx'), '', 'utf8');
    expect(routeFileExists('/admin/leads', root)).toBe(true);
  });

  it('retorna true quan existeix page.ts', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-route-'));
    const dir = path.join(root, 'admin', 'clients');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'page.ts'), '', 'utf8');
    expect(routeFileExists('/admin/clients', root)).toBe(true);
  });

  it('retorna false quan no existeix cap page file', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-route-'));
    expect(routeFileExists('/admin/inexistent', root)).toBe(false);
  });

  it('retorna true per rutes dinàmiques sense verificar fitxer', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-route-'));
    expect(routeFileExists('/admin/leads/[id]', root)).toBe(true);
  });
});

// — integració script complet —

describe('check-admin-manual-hrefs (integració)', () => {
  it('passa quan tots els hrefs apunten a pages existents', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': `export const X = { adminHref: '/admin/leads' };`,
      'app/admin/leads/page.tsx': 'export default function Page() {}',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('falla quan un href apunta a una pàgina inexistent', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': `export const X = { adminHref: '/admin/inexistent' };`,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/admin/inexistent');
    expect(result.stderr).toContain('FAIL');
  });

  it('no falla si tots els hrefs amb segments dinàmics', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': `export const X = { adminHref: '/admin/leads/[id]' };`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('reporta múltiples hrefs trencats', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': [
        `export const X = {`,
        `  adminHref: '/admin/missing-a',`,
        `  href: '/admin/missing-b',`,
        `};`,
      ].join('\n'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/admin/missing-a');
    expect(result.stderr).toContain('/admin/missing-b');
  });

  it('falla si el fitxer adminManual.ts no existeix', () => {
    const result = runGuard({});
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('no trobat');
  });
});
