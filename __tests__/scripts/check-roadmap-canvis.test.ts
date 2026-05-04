// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-roadmap-canvis.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-roadmap-canvis-'));
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

const ROADMAP_HEADER = `export const ADMIN_MANUAL_ROADMAP: AdminManualRoadmapItem[] = [\n`;
const ROADMAP_FOOTER = `];\n`;

function roadmap(items: Array<{ id: string; doneCanvi?: number }>): string {
  const blocks = items
    .map((item) => {
      const canviLine = item.doneCanvi ? `\n    doneCanvi: ${item.doneCanvi},` : '';
      return `  {\n    id: '${item.id}',${canviLine}\n  },\n`;
    })
    .join('');
  return ROADMAP_HEADER + blocks + ROADMAP_FOOTER;
}

function protocol(canvis: Array<{ n: number; status?: string }>): string {
  return canvis
    .map(({ n, status = 'FET' }) => `### Canvi #${n} — 2026-04-30 — claude (${status})\n**Body.**\n`)
    .join('\n');
}

describe('check-roadmap-canvis', () => {
  it('passes when every doneCanvi maps to a registered FET canvi', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': roadmap([
        { id: 'foo', doneCanvi: 100 },
        { id: 'bar', doneCanvi: 200 },
      ]),
      'docs/protocol-producte-admin-ca.md': protocol([
        { n: 100 },
        { n: 200 },
        { n: 300 },
      ]),
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('passes when no roadmap item has doneCanvi', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': roadmap([{ id: 'pending-only' }]),
      'docs/protocol-producte-admin-ca.md': protocol([{ n: 100 }]),
    });
    expect(result.status).toBe(0);
  });

  it('fails when a doneCanvi references a Canvi #N that does not exist at §9', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': roadmap([{ id: 'orphan', doneCanvi: 999 }]),
      'docs/protocol-producte-admin-ca.md': protocol([{ n: 100 }]),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('orphan');
    expect(result.stderr).toContain('999');
  });

  it('fails when a doneCanvi references a Canvi registered with non-FET status', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': roadmap([{ id: 'in-progress', doneCanvi: 500 }]),
      'docs/protocol-producte-admin-ca.md': protocol([{ n: 500, status: 'EN MARXA' }]),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('500');
  });

  it('fails when the protocol file is missing', () => {
    const result = runGuard({
      'lib/constants/adminManual.ts': roadmap([{ id: 'foo', doneCanvi: 100 }]),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('protocol');
  });
});
