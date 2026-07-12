// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-manolo-boundary.mjs');

const boundaryClause = [
  'Manolo no autoritza schema.',
  'Manolo no autoritza migracions.',
  'Manolo no autoritza endpoints.',
  'Qualsevol excepcio exigeix autorització explícita del propietari.',
].join(' ');

function packageJson(validateCore = 'pnpm run qa:protocol && pnpm run qa:manolo-boundary') {
  return JSON.stringify(
    {
      scripts: {
        'qa:manolo-boundary': 'node scripts/check-manolo-boundary.mjs',
        'validate:core': validateCore,
      },
    },
    null,
    2,
  );
}

function protocol(changeBody = '') {
  return `${boundaryClause}\n\n### Canvi #1755 — 2026-07-09 — codex (FET)\n${changeBody}\n`;
}

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-manolo-boundary-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>) {
  const cwd = writeFixture({
    'CLAUDE.md': boundaryClause,
    'docs/protocol-producte-admin-ca.md': protocol('Canvi visual Manolo sense risc.'),
    'docs/protocol-executiu.md': boundaryClause,
    'package.json': packageJson(),
    ...files,
  });
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-manolo-boundary', () => {
  it('passa quan docs, package i canvis respecten el limit de Manolo', () => {
    const result = runGuard({});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[manolo-boundary] OK');
  });

  it('falla si un Canvi Manolo toca schema sense autoritzacio explicita', () => {
    const result = runGuard({
      'docs/protocol-producte-admin-ca.md': protocol('Manolo afegeix schema i migracio nova.'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Canvi #1755');
    expect(result.stderr).toContain('Autorització explícita propietari');
  });

  it('passa si el canvi restringit porta autoritzacio explicita del propietari', () => {
    const result = runGuard({
      'docs/protocol-producte-admin-ca.md': protocol([
        '- Autorització explícita propietari: el propietari ordena aquest canvi.',
        'Manolo toca schema per revertir una deriva.',
      ].join('\n')),
    });
    expect(result.status).toBe(0);
  });

  it('falla si validate:core no executa el guard', () => {
    const result = runGuard({
      'package.json': packageJson('pnpm run qa:protocol'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('validate:core');
  });

  it('falla amb fitxers .dbg-* versionables', () => {
    const result = runGuard({
      '.dbg-manolo-pacte.cjs': 'console.log("debug");',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('.dbg-manolo-pacte.cjs');
  });
});
