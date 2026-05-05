// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-layer-catalogs.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-layer-catalogs-'));
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

describe('check-layer-catalogs', () => {
  it('passes with the OK marker when no suspicious local catalogs exist', () => {
    const result = runGuard({
      'app/page.tsx': "export const x = 1;\nexport function helper() { return 2; }",
      'lib/foo.ts': "export const y = 'string';\nexport class Foo {}",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('flags an array catalog declared inline (export const NAME = [ ... ])', () => {
    const result = runGuard({
      'app/components/leak.tsx': "export const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'WON'];",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('STATUS_OPTIONS');
    expect(result.stderr).toMatch(/app[/\\]components[/\\]leak\.tsx/);
  });

  it('flags an object catalog declared inline (const NAME = { ... })', () => {
    const result = runGuard({
      'lib/services/leak.ts': "const COLOR_MAP = { primary: '#000', secondary: '#fff' };",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('COLOR_MAP');
  });

  it('flags a Set-based catalog (const NAME = new Set(...))', () => {
    const result = runGuard({
      'lib/services/leak.ts': "const ALLOWED_TYPES = new Set(['A', 'B', 'C']);",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ALLOWED_TYPES');
  });

  it('flags Object.freeze(...) catalogs', () => {
    const result = runGuard({
      'lib/leak.ts': "const FROZEN_MAP = Object.freeze({ a: 1, b: 2 });",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FROZEN_MAP');
  });

  it('does NOT flag lowercase or PascalCase const declarations', () => {
    const result = runGuard({
      'lib/clean.ts': "export const myValue = [1, 2, 3];\nexport const MyClass = { field: 1 };",
    });
    expect(result.status).toBe(0);
  });

  it('ignores app/config, app/api, app/admin/components and lib/constants by path', () => {
    const result = runGuard({
      'app/config/leak.ts': "export const STATUS_OPTIONS = ['A', 'B'];",
      'app/api/route.ts': "export const ALLOWED_METHODS = ['GET', 'POST'];",
      'app/admin/components/leak.tsx': "export const COLORS = { red: '#f00' };",
      'lib/constants/leak.ts': "export const TASK_SOURCE = { AUTOMATION: 'AUTOMATION' };",
    });
    expect(result.status).toBe(0);
  });

  it('does not scan extensions other than ts/tsx/js/jsx/mjs/cjs', () => {
    const result = runGuard({
      'app/leak.json': "{ \"const STATUS = ['A']\": 1 }",
      'app/leak.md': "Documentation: const STATUS = ['A'];",
    });
    expect(result.status).toBe(0);
  });

  it('reports multiple findings across files', () => {
    const result = runGuard({
      'app/leak1.tsx': "export const FOO = ['a'];",
      'lib/leak2.ts': "const BAR = { x: 1 };",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FOO');
    expect(result.stderr).toContain('BAR');
    expect(result.stderr).toMatch(/Move declarative catalogs to lib\/constants/);
  });

  it('only scans app/ and lib/ — files in other roots are out of scope', () => {
    const result = runGuard({
      'docs/example.ts': "export const STATUS_OPTIONS = ['A', 'B'];",
      'scripts/leak.mjs': "export const HELPERS = { x: 1 };",
    });
    expect(result.status).toBe(0);
  });
});
