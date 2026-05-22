// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-product-operating-system.mjs');

const productOperatingSystemDoc = [
  '# Product Operating System — Òrbita Events',
  '## Frase de sistema',
  '## Cicle únic',
  '1. Captar demanda',
  '2. Qualificar i negociar',
  '3. Pressupostar amb marge',
  '4. Executar reserva',
  '5. Cobrar i controlar',
  '6. Reactivar i generar recurrència',
  'Cada pantalla nova ha d’encaixar en un pas del cicle.',
  'El manual `/admin/manual` és la vista operativa d’aquest sistema.',
  'El zenit no és afegir més mòduls.',
].join('\n');

const protocolDoc = [
  '## 6.1 Fonaments de producte',
  '**FET**: narrativa mare a docs/product-operating-system-ca.md.',
  '**FET**: Canvi #606 i Canvi #668 consoliden el sistema.',
  '**FET residual** *(2026-05-18 per codex — Canvi #680)*: guard executable.',
].join('\n');

const adminManualSource = [
  'export const ADMIN_MANUAL_OPERATING_FLOW = [',
  "  { step: '01' },",
  "  { step: '02' },",
  "  { step: '03' },",
  "  { step: '04' },",
  "  { step: '05' },",
  "  { step: '06' },",
  '];',
  'export const ADMIN_MANUAL_OPERATING_GATES = [];',
  'export const ADMIN_MANUAL_OPERATING_HANDOFFS = [];',
  'export const ADMIN_MANUAL_OPERATING_STEP_CHECKLIST = [];',
  'export const ADMIN_MANUAL_OPERATING_EVIDENCE = [];',
].join('\n');

const dashboardService = [
  "import { ADMIN_MANUAL_OPERATING_FLOW } from '@/lib/constants/adminManual';",
  'export function buildDashboardOperatingCycle() {',
  '  return ADMIN_MANUAL_OPERATING_FLOW.map((flowStep) => flowStep);',
  '}',
].join('\n');

function packageJson(validateCore = 'pnpm run qa:protocol && pnpm run qa:product-operating-system') {
  return JSON.stringify(
    {
      scripts: {
        'qa:product-operating-system': 'node scripts/check-product-operating-system.mjs',
        'validate:core': validateCore,
      },
    },
    null,
    2,
  );
}

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-pos-'));
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

function validFixture(overrides: Record<string, string> = {}) {
  return {
    'docs/product-operating-system-ca.md': productOperatingSystemDoc,
    'docs/protocol-producte-admin-ca.md': protocolDoc,
    'lib/constants/adminManual.ts': adminManualSource,
    'lib/services/adminOperatingCycleService.ts': dashboardService,
    'package.json': packageJson(),
    ...overrides,
  };
}

describe('check-product-operating-system', () => {
  it('passa quan narrativa, manual, Dashboard i validate:core estan connectats', () => {
    const result = runGuard(validFixture());

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[product-operating-system] OK');
  });

  it('falla si el document mare perd la regla de producte', () => {
    const result = runGuard(validFixture({
      'docs/product-operating-system-ca.md': productOperatingSystemDoc.replace('Cada pantalla nova ha d’encaixar en un pas del cicle.', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('product operating system');
    expect(result.stderr).toContain('Cada pantalla nova');
  });

  it('falla si el manual deixa de cobrir un pas canònic', () => {
    const result = runGuard(validFixture({
      'lib/constants/adminManual.ts': adminManualSource.replace("  { step: '06' },", ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('manual admin');
    expect(result.stderr).toContain("step: '06'");
  });

  it('falla si el Dashboard deixa de derivar del flux canònic del manual', () => {
    const result = runGuard(validFixture({
      'lib/services/adminOperatingCycleService.ts': 'export function buildDashboardOperatingCycle() { return []; }',
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('dashboard');
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_FLOW');
  });

  it('falla si validate:core no executa el guard', () => {
    const result = runGuard(validFixture({
      'package.json': packageJson('pnpm run qa:protocol'),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('validate:core');
    expect(result.stderr).toContain('qa:product-operating-system');
  });
});
