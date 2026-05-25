// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-admin-change-log.mjs');

function writeFixture(protocol: string, counter: number, diario?: string, labNumber?: number) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-protocol-'));
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  mkdirSync(path.join(root, 'lib', 'constants'), { recursive: true });
  writeFileSync(path.join(root, 'docs', 'protocol-producte-admin-ca.md'), protocol, 'utf8');
  writeFileSync(
    path.join(root, 'docs', 'diario.md'),
    diario ?? diarioEntry(counter),
    'utf8',
  );
  writeFileSync(
    path.join(root, 'lib', 'constants', 'admin.ts'),
    `export const ADMIN_CHANGE_COUNTER = ${counter};\n`,
    'utf8',
  );
  if (labNumber !== undefined) {
    mkdirSync(path.join(root, 'app', 'studio-lab', 'leads'), { recursive: true });
    writeFileSync(
      path.join(root, 'app', 'studio-lab', 'leads', 'page.tsx'),
      `const LAB_CHANGE_NUMBER = ${labNumber};\n`,
      'utf8',
    );
  }
  return root;
}

function runGuard(protocol: string, counter: number, diario?: string, labNumber?: number) {
  const cwd = writeFixture(protocol, counter, diario, labNumber);
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

function diarioEntry(number: number, fields = true) {
  return [
    `## 2026-04-10 — Canvi #${number}: canvi de prova`,
    '### Tancament',
    fields ? '- Validació tècnica: test de prova.' : '',
    fields ? '- Validació funcional: comportament de prova.' : '',
    fields ? '- Validació humana/UX: lectura de prova.' : '',
    fields ? '- Començat per: `codex`' : '',
    fields ? '- Treballant per: `codex`' : '',
    fields ? '- Tancat per: `codex`' : '',
    '',
  ].filter(Boolean).join('\n');
}

function change(number: number, fields = true) {
  return [
    `### Canvi #${number} — 2026-04-10 — codex (FET)`,
    '**Canvi de prova.**',
    '- Detall de prova.',
    fields ? '- Validació tècnica: test de prova.' : '',
    fields ? '- Validació funcional: comportament de prova.' : '',
    fields ? '- Validació humana/UX: lectura de prova.' : '',
    fields ? '- Començat per: `codex`' : '',
    fields ? '- Treballant per: `codex`' : '',
    fields ? '- Tancat per: `codex`' : '',
  ].filter(Boolean).join('\n');
}

describe('check-admin-change-log', () => {
  it('accepts a synchronized protocol with required ownership fields', () => {
    const result = runGuard(`${change(57)}\n${change(58)}\n`, 58);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Current: #58');
  });

  it('rejects duplicated change numbers', () => {
    const result = runGuard(`${change(57)}\n${change(57)}\n`, 57);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('duplicate change numbers');
  });

  it('rejects a counter that does not match the max protocol change', () => {
    const result = runGuard(`${change(57)}\n${change(58)}\n`, 57);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_CHANGE_COUNTER=57 but protocol max is #58');
  });

  it('rejects missing diario entry for the current counter', () => {
    const result = runGuard(
      `${change(57)}\n${change(58)}\n`,
      58,
      diarioEntry(57),
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('docs/diario.md missing entry for current change #58');
  });

  it('rejects current diario entries without ownership fields', () => {
    const result = runGuard(
      `${change(57)}\n${change(58)}\n`,
      58,
      [
        '## 2026-04-10 — Canvi #58: canvi de prova',
        '### Tancament',
        '- Validació tècnica: test de prova.',
        '- Validació funcional: comportament de prova.',
        '- Validació humana/UX: lectura de prova.',
        '',
      ].join('\n'),
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('docs/diario.md current entry #58 missing ownership fields');
  });

  it('rejects current diario entries without validation layers', () => {
    const result = runGuard(
      `${change(57)}\n${change(58)}\n`,
      58,
      [
        '## 2026-04-10 — Canvi #58: canvi de prova',
        '### Tancament',
        '- Començat per: `codex`',
        '- Treballant per: `codex`',
        '- Tancat per: `codex`',
        '',
      ].join('\n'),
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('docs/diario.md current entry #58 missing validation layers');
  });

  it('rejects current protocol entries without validation layers', () => {
    const result = runGuard(
      [
        change(57),
        [
          '### Canvi #58 — 2026-04-10 — codex (FET)',
          '**Canvi de prova.**',
          '- Detall de prova.',
          '- Començat per: `codex`',
          '- Treballant per: `codex`',
          '- Tancat per: `codex`',
        ].join('\n'),
      ].join('\n'),
      58,
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('protocol current entry #58 missing validation layers');
  });

  it('rejects new changes without ownership fields', () => {
    const result = runGuard(`${change(57, false)}\n`, 57);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('missing ownership fields');
  });

  it('accepts a studio-lab leads chip aligned with the counter', () => {
    const result = runGuard(`${change(57)}\n${change(58)}\n`, 58, undefined, 58);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Current: #58');
  });

  it('rejects a studio-lab leads chip that lags behind the counter', () => {
    const result = runGuard(`${change(57)}\n${change(58)}\n`, 58, undefined, 57);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('LAB_CHANGE_NUMBER=57');
    expect(result.stderr).toContain('ADMIN_CHANGE_COUNTER=58');
  });

  it('rejects literal newline artifacts in the protocol', () => {
    const result = runGuard(`${change(57)}\ntext with literal artifact ` + '`r`n' + ` inside\n`, 57);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('literal PowerShell newline artifact');
  });
});
