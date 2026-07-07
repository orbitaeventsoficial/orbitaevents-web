// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-zenit-roadmap.mjs');
const ROADMAP_NAME = 'MANOLO-ZENIT-RESET-TOTAL-1551.md';

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-zenit-roadmap-'));
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

function packageJson(validateCore = 'pnpm run qa:protocol && pnpm run qa:zenit-roadmap') {
  return JSON.stringify({
    scripts: {
      'qa:zenit-roadmap': 'node scripts/check-zenit-roadmap.mjs',
      'validate:core': validateCore,
    },
  });
}

function protocol(current: number, declaresRoadmap = true) {
  const roadmapLine = declaresRoadmap
    ? `- Roadmap: docs/audit/${ROADMAP_NAME} actualitzat amb #${current}.\n`
    : '';
  return [
    '### Canvi #10 — 2026-07-07 — codex (FET)',
    '**Antic.**',
    '',
    `### Canvi #${current} — 2026-07-07 — codex (FET)`,
    '**Actual.**',
    roadmapLine,
  ].join('\n');
}

describe('check-zenit-roadmap', () => {
  it('passa quan el canvi actual declara el roadmap i el roadmap menciona el canvi', () => {
    const result = runGuard({
      'package.json': packageJson(),
      'docs/admin-protocol.md': protocol(1575),
      [`docs/audit/${ROADMAP_NAME}`]: '- **#1575**: guard roadmap.\n',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('falla quan el protocol declara roadmap pero falta el canvi al roadmap', () => {
    const result = runGuard({
      'package.json': packageJson(),
      'docs/admin-protocol.md': protocol(1575),
      [`docs/audit/${ROADMAP_NAME}`]: '- **#1574**: snapshot.\n',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('#1575');
  });

  it('no exigeix el roadmap als canvis normals que no el declaren', () => {
    const result = runGuard({
      'package.json': packageJson(),
      'docs/admin-protocol.md': protocol(1600, false),
    });

    expect(result.status).toBe(0);
  });

  it('falla si validate:core no executa el guard', () => {
    const result = runGuard({
      'package.json': packageJson('pnpm run qa:protocol'),
      'docs/admin-protocol.md': protocol(1575),
      [`docs/audit/${ROADMAP_NAME}`]: '- **#1575**: guard roadmap.\n',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('validate:core');
  });
});
