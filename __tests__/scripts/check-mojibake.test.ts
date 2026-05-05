// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-mojibake.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-mojibake-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>, extraArgs: string[] = []) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [scriptPath, ...extraArgs], { cwd, encoding: 'utf8' });
}

describe('check-mojibake', () => {
  it('passes when scanned files contain clean UTF-8', () => {
    const result = runGuard({
      'app/page.tsx': "export const greeting = 'Hola, món! Açò està net.';",
      'lib/foo.ts': "export const x = 'Bona tarda';",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Mojibake scan clean');
  });

  it('detects UTF8_CP1252_A_TILDE pattern (Ã + char)', () => {
    const result = runGuard({
      'app/leak.tsx': "export const broken = 'Ã©xito';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('UTF8_CP1252_A_TILDE');
    expect(result.stderr).toContain('app/leak.tsx');
  });

  it('detects UTF8_CP1252_A_CIRCUMFLEX pattern (Â + char)', () => {
    const result = runGuard({
      'lib/leak.ts': "export const broken = 'Â breu pausa';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('UTF8_CP1252_A_CIRCUMFLEX');
    expect(result.stderr).toContain('lib/leak.ts');
  });

  it('detects BROKEN_EMOJI pattern (ðŸ...)', () => {
    const result = runGuard({
      'app/emoji.tsx': "export const broken = 'Reaccio: ðŸ';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('BROKEN_EMOJI');
  });

  it('detects REPLACEMENT_CHAR pattern (U+FFFD)', () => {
    const result = runGuard({
      'app/replacement.tsx': "export const broken = 'token: �';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('REPLACEMENT_CHAR');
  });

  it('skips node_modules and .next folders', () => {
    const result = runGuard({
      'node_modules/somepkg/index.js': "export const x = 'Ã©xito';",
      '.next/server/page.js': "export const y = 'Â pausa';",
      'app/clean.tsx': "export const ok = 'net';",
    });
    expect(result.status).toBe(0);
  });

  it('skips dist and coverage folders', () => {
    const result = runGuard({
      'dist/output.js': "export const x = 'Ã©xito';",
      'coverage/lcov.info': "Â breakage",
      'app/clean.tsx': "export const ok = 'net';",
    });
    expect(result.status).toBe(0);
  });

  it('skips its own script (scripts/check-mojibake.mjs)', () => {
    const result = runGuard({
      'scripts/check-mojibake.mjs': "// patterns: 'Ã©', 'Â ', 'ðŸ' — strings de patró del propi guard",
      'app/clean.tsx': "export const ok = 'net';",
    });
    expect(result.status).toBe(0);
  });

  it('skips docs/diario.md (registre operatiu pot mencionar mojibake fix)', () => {
    const result = runGuard({
      'docs/diario.md': "## Canvi: fix mojibake — exemple 'Ã©xito' reparat",
      'app/clean.tsx': "export const ok = 'net';",
    });
    expect(result.status).toBe(0);
  });

  it('skips lock files (pnpm-lock.yaml, package-lock.json, yarn.lock)', () => {
    const result = runGuard({
      'pnpm-lock.yaml': "Ã©xito",
      'package-lock.json': "{ \"x\": \"Â pausa\" }",
      'yarn.lock': "ðŸ",
      'app/clean.tsx': "export const ok = 'net';",
    });
    expect(result.status).toBe(0);
  });

  it('only scans text-file extensions (binary-like extensions ignored)', () => {
    const result = runGuard({
      'app/clean.tsx': "export const ok = 'net';",
      'app/binary.png': "Ã©xito (no escanejat per .png)",
    });
    expect(result.status).toBe(0);
  });

  it('--paths arg restricts the scan to the specified roots', () => {
    const result = runGuard({
      'app/leak.tsx': "export const broken = 'Ã©xito';",
      'lib/clean.ts': "export const ok = 'net';",
    }, ['--paths', 'lib']);
    expect(result.status).toBe(0);
  });

  it('reports multiple violations across files with file:line:label format', () => {
    const result = runGuard({
      'app/leak1.tsx': "export const a = 'Ã©';\nexport const b = 'Â x';",
      'lib/leak2.ts': "export const c = 'token: �';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/leak1.tsx');
    expect(result.stderr).toContain('lib/leak2.ts');
    expect(result.stderr).toMatch(/Mojibake detected in \d+ file/);
  });
});
