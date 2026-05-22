// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-debugger.mjs');

function makeDir(root: string, ...segments: string[]) {
  const dir = path.join(root, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-no-debugger', () => {
  it('passes when no debugger statement exists in app/ or lib/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-debugger-'));
    const dir = makeDir(root, 'app', 'admin', 'test');
    writeFileSync(path.join(dir, 'page.tsx'), 'export default function Page() { return null; }');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-debugger] OK');
  });

  it('fails when debugger is found in app/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-debugger-'));
    const dir = makeDir(root, 'app', 'admin', 'test');
    writeFileSync(path.join(dir, 'page.tsx'), 'export default function Page() { debugger; return null; }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-debugger] FAIL');
    expect(result.stderr).toContain('app/admin/test/page.tsx');
  });

  it('fails when debugger is found in lib/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-debugger-'));
    const dir = makeDir(root, 'lib', 'services');
    writeFileSync(path.join(dir, 'myService.ts'), 'export function foo() { debugger; return 42; }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('lib/services/myService.ts');
  });

  it('ignores debugger inside comment lines', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-debugger-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(
      path.join(dir, 'Component.tsx'),
      '// debugger; // was left here\nexport default function C() { return null; }',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-debugger] OK');
  });

  it('ignores test files (.test.tsx)', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-debugger-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(path.join(dir, 'Component.test.tsx'), 'debugger;');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-debugger] OK');
  });

  it('reports multiple violations across files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-debugger-'));
    const dir1 = makeDir(root, 'app', 'admin', 'bookings');
    writeFileSync(path.join(dir1, 'page.tsx'), 'debugger;');
    const dir2 = makeDir(root, 'lib', 'services');
    writeFileSync(path.join(dir2, 'svc.ts'), 'export function foo() { debugger; }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('bookings/page.tsx');
    expect(result.stderr).toContain('lib/services/svc.ts');
  });
});
