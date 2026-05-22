// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-service-coverage.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-svc-cov-'));
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

const serviceStub = `export async function doSomething() { return null; }`;
const testStub = `import { describe, it } from 'vitest'; describe('x', () => { it('y', () => {}); });`;

describe('check-service-coverage', () => {
  it('passes quan tots els serveis tenen test', () => {
    const result = runGuard({
      'lib/services/bookingService.ts': serviceStub,
      'lib/services/leadService.ts': serviceStub,
      '__tests__/lib/services/bookingService.test.ts': testStub,
      '__tests__/lib/services/leadService.test.ts': testStub,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[service-coverage] OK');
  });

  it('falla quan un servei no té test', () => {
    const result = runGuard({
      'lib/services/bookingService.ts': serviceStub,
      'lib/services/leadService.ts': serviceStub,
      '__tests__/lib/services/bookingService.test.ts': testStub,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[service-coverage] FAIL');
    expect(result.stderr).toContain('leadService.ts');
  });

  it('reporta tots els serveis sense test, no només el primer', () => {
    const result = runGuard({
      'lib/services/serviceA.ts': serviceStub,
      'lib/services/serviceB.ts': serviceStub,
      'lib/services/serviceC.ts': serviceStub,
      '__tests__/lib/services/serviceB.test.ts': testStub,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('serviceA.ts');
    expect(result.stderr).toContain('serviceC.ts');
    expect(result.stderr).not.toContain('serviceB.ts');
  });

  it('ignora fitxers .d.ts de serveis', () => {
    const result = runGuard({
      'lib/services/bookingService.ts': serviceStub,
      'lib/services/bookingService.d.ts': '',
      '__tests__/lib/services/bookingService.test.ts': testStub,
    });
    expect(result.status).toBe(0);
  });

  it('passa sense cap servei present', () => {
    const result = runGuard({
      'lib/services/.gitkeep': '',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[service-coverage] OK');
  });

  it('troba serveis en subdirectoris de lib/services', () => {
    const result = runGuard({
      'lib/services/tasks/leadScopedTaskService.ts': serviceStub,
      '__tests__/lib/services/leadScopedTaskService.test.ts': testStub,
    });
    expect(result.status).toBe(0);
  });

  it('falla si un servei en subdir no té test', () => {
    const result = runGuard({
      'lib/services/tasks/deepService.ts': serviceStub,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('deepService.ts');
  });

  it('passa quan tots els utils tenen test', () => {
    const result = runGuard({
      'lib/utils/sanitize.ts': serviceStub,
      '__tests__/lib/utils/sanitize.test.ts': testStub,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[service-coverage] OK');
  });

  it('falla quan un util no té test', () => {
    const result = runGuard({
      'lib/utils/sanitize.ts': serviceStub,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[service-coverage] FAIL');
    expect(result.stderr).toContain('sanitize.ts');
  });

  it('passa quan tots els hooks tenen test', () => {
    const result = runGuard({
      'lib/hooks/useUtmParams.ts': serviceStub,
      '__tests__/lib/hooks/useUtmParams.test.ts': testStub,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[service-coverage] OK');
  });

  it('falla quan un hook no té test', () => {
    const result = runGuard({
      'lib/hooks/useBookedDates.ts': serviceStub,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[service-coverage] FAIL');
    expect(result.stderr).toContain('useBookedDates.ts');
  });

  it('passa quan el test del hook usa extensió .tsx', () => {
    const result = runGuard({
      'lib/hooks/useManagedImageSrc.ts': serviceStub,
      '__tests__/lib/hooks/useManagedImageSrc.test.tsx': testStub,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[service-coverage] OK');
  });

  it('passa quan tots els fitxers de lib/api/ tenen test', () => {
    const result = runGuard({
      'lib/api/openapi.ts': serviceStub,
      '__tests__/lib/api/openapi.test.ts': testStub,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[service-coverage] OK');
  });

  it('falla quan un fitxer de lib/api/ no té test', () => {
    const result = runGuard({
      'lib/api/openapi.ts': serviceStub,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[service-coverage] FAIL');
    expect(result.stderr).toContain('openapi.ts');
  });

  it('passa quan tots els fitxers de lib/admin/ tenen test', () => {
    const result = runGuard({
      'lib/admin/customerWorkspaceHref.ts': serviceStub,
      '__tests__/lib/admin/customerWorkspaceHref.test.ts': testStub,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[service-coverage] OK');
  });

  it('falla quan un fitxer de lib/admin/ no té test', () => {
    const result = runGuard({
      'lib/admin/leadCustomerHref.ts': serviceStub,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[service-coverage] FAIL');
    expect(result.stderr).toContain('leadCustomerHref.ts');
  });
});
