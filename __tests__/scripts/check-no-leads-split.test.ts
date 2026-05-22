// @vitest-environment node
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-leads-split.mjs');

function runGuard(dirs: string[]) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-leads-split-'));
  mkdirSync(path.join(root, 'app', 'admin'), { recursive: true });
  for (const dir of dirs) {
    mkdirSync(path.join(root, 'app', 'admin', dir), { recursive: true });
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-leads-split', () => {
  it('passa quan no hi ha directoris a app/admin', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-leads-split] OK');
  });

  it('passa quan app/admin/leads/ existeix (directori canònic)', () => {
    const result = runGuard(['leads', 'leads/[id]', 'leads/reengagement']);
    expect(result.status).toBe(0);
  });

  it('falla quan existeix app/admin/pipeline/', () => {
    const result = runGuard(['pipeline']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-leads-split] FAIL');
    expect(result.stderr).toContain('pipeline');
  });

  it('falla quan existeix app/admin/prospects/', () => {
    const result = runGuard(['prospects']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('prospects');
  });

  it('falla quan existeix app/admin/lead-hub/', () => {
    const result = runGuard(['lead-hub']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('lead-hub');
  });

  it('falla quan existeix app/admin/sales-pipeline/', () => {
    const result = runGuard(['sales-pipeline']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('sales-pipeline');
  });

  it('passa quan existeix app/admin/sales-ops/ (workspace canònic de SLA/seqüències)', () => {
    const result = runGuard(['sales-ops', 'bookings', 'clientes', 'inbox']);
    expect(result.status).toBe(0);
  });

  it('falla quan un split apareix en un subdirectori niuat', () => {
    const result = runGuard(['reporting/pipeline']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('pipeline');
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard(['pipeline', 'prospects', 'funnel']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('pipeline');
    expect(result.stderr).toContain('prospects');
    expect(result.stderr).toContain('funnel');
  });
});
