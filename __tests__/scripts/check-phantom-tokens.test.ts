// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-phantom-tokens.mjs');

function runGuard(files: Record<string, string>) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phantom-'));
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(tmp, name);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  const r = spawnSync('node', [SCRIPT], { cwd: tmp, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return r;
}

describe('check-phantom-tokens', () => {
  it('CAÇA un token fantasma sense fallback usat a l\'admin', () => {
    const r = runGuard({
      'app/admin/foo.css': 'html.admin-mode .x { color: var(--o-inexistent); }',
      'app/studio/orbita-tokens.css': ':root { --t: #fff; }',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('--o-inexistent');
  });

  it('NO marca un token amb fallback', () => {
    const r = runGuard({
      'app/admin/foo.css': 'html.admin-mode .x { color: var(--o-inexistent, #fff); }',
      'app/studio/orbita-tokens.css': ':root { --t: #fff; }',
    });
    expect(r.status).toBe(0);
  });

  it('NO marca un token definit en algun CSS', () => {
    const r = runGuard({
      'app/admin/foo.css': 'html.admin-mode .x { color: var(--o-real); }',
      'app/studio/orbita-tokens.css': ':root { --o-real: #abc; }',
    });
    expect(r.status).toBe(0);
  });

  it('NO marca un token injectat en runtime via [style*="--tok"]', () => {
    const r = runGuard({
      'app/admin/foo.css':
        'html.admin-mode .k[style*="--hue"] { color: hsl(var(--hue) 80% 50%); }',
      'app/studio/orbita-tokens.css': ':root { --t: #fff; }',
    });
    expect(r.status).toBe(0);
  });

  it('NO marca un token que només apareix dins un comentari CSS', () => {
    const r = runGuard({
      'app/admin/foo.css': '/* tot via tokens var(--ax-*) */\nhtml.admin-mode .x { color: var(--t); }',
      'app/studio/orbita-tokens.css': ':root { --t: #fff; }',
    });
    expect(r.status).toBe(0);
  });

  it('NO marca les variables de next/font (injectades en runtime)', () => {
    const r = runGuard({
      'app/admin/foo.css': 'html.admin-mode .x { font-family: var(--font-inter); }',
      'app/studio/orbita-tokens.css': ':root { --t: #fff; }',
    });
    expect(r.status).toBe(0);
  });
});
