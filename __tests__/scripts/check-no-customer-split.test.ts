// @vitest-environment node
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-customer-split.mjs');

function runGuard(dirs: string[]) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-customer-split-'));
  mkdirSync(path.join(root, 'app', 'admin'), { recursive: true });
  for (const dir of dirs) {
    mkdirSync(path.join(root, 'app', 'admin', dir), { recursive: true });
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-customer-split', () => {
  it('passa quan no hi ha directoris a app/admin', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-customer-split] OK');
  });

  it('passa quan app/admin/clientes/ existeix (directori canònic)', () => {
    const result = runGuard(['clientes', 'clientes/[id]', 'clientes/[id]/_components']);
    expect(result.status).toBe(0);
  });

  it('falla quan existeix app/admin/customers/ (plural no-canònic)', () => {
    const result = runGuard(['customers']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-customer-split] FAIL');
    expect(result.stderr).toContain('customers');
  });

  it('falla quan existeix app/admin/customer-analytics/', () => {
    const result = runGuard(['customer-analytics']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('customer-analytics');
  });

  it('falla quan existeix app/admin/crm/', () => {
    const result = runGuard(['crm']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('crm');
  });

  it('falla quan existeix app/admin/client-portal/ fora del canònic', () => {
    const result = runGuard(['client-portal']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('client-portal');
  });

  it('passa quan existeix app/admin/bookings/ i app/admin/leads/ (no son customer-splits)', () => {
    const result = runGuard(['bookings', 'leads', 'tasks', 'intake', 'settings']);
    expect(result.status).toBe(0);
  });

  it('falla quan un split de client apareix en un subdirectori niuat', () => {
    const result = runGuard(['reporting/customer-analytics']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('customer-analytics');
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard(['customers', 'customer-hub', 'crm']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('customers');
    expect(result.stderr).toContain('customer-hub');
    expect(result.stderr).toContain('crm');
  });
});
