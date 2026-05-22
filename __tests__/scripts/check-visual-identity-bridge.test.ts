// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-visual-identity-bridge.mjs');

const bridgeDoc = [
  "# Pont d'identitat visual — admin, web pública i mòduls nous",
  'La web pública ven confiança.',
  "L'admin governa decisions.",
  'CTA principal únic per bloc.',
  "Checklist abans d'afegir o redissenyar.",
  "La coherència visual d'Òrbita es governa per funció.",
].join('\n');

const protocolDoc = [
  '## §6.11 UX / Visual / Marca',
  '**FET residual**: identitat visual coherent entre admin, web pública i mòduls nous.',
  '**FET**: el pont viu a docs/visual-identity-bridge-ca.md per Canvi #605 i Canvi #681.',
].join('\n');

function packageJson(validateCore = 'pnpm run qa:visual-overflow && pnpm run qa:visual-identity-bridge') {
  return JSON.stringify(
    {
      scripts: {
        'qa:visual-identity-bridge': 'node scripts/check-visual-identity-bridge.mjs',
        'validate:core': validateCore,
      },
    },
    null,
    2,
  );
}

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-visual-bridge-'));
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

describe('check-visual-identity-bridge', () => {
  it('passa quan el pont, el protocol i validate:core estan connectats', () => {
    const result = runGuard({
      'docs/visual-identity-bridge-ca.md': bridgeDoc,
      'docs/protocol-producte-admin-ca.md': protocolDoc,
      'package.json': packageJson(),
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[visual-identity-bridge] OK');
  });

  it('falla si el pont visual perd el criteri de funció', () => {
    const result = runGuard({
      'docs/visual-identity-bridge-ca.md': bridgeDoc.replace("La coherència visual d'Òrbita es governa per funció.", ''),
      'docs/protocol-producte-admin-ca.md': protocolDoc,
      'package.json': packageJson(),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('pont visual');
    expect(result.stderr).toContain("coherència visual d'Òrbita es governa per funció");
  });

  it('falla si el protocol deixa de citar el document canònic', () => {
    const result = runGuard({
      'docs/visual-identity-bridge-ca.md': bridgeDoc,
      'docs/protocol-producte-admin-ca.md': protocolDoc.replace('docs/visual-identity-bridge-ca.md', 'docs/altra-cosa.md'),
      'package.json': packageJson(),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('protocol');
    expect(result.stderr).toContain('docs/visual-identity-bridge-ca.md');
  });

  it('falla si validate:core no executa el guard', () => {
    const result = runGuard({
      'docs/visual-identity-bridge-ca.md': bridgeDoc,
      'docs/protocol-producte-admin-ca.md': protocolDoc,
      'package.json': packageJson('pnpm run qa:visual-overflow'),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('validate:core');
    expect(result.stderr).toContain('qa:visual-identity-bridge');
  });
});
