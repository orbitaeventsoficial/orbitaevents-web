// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-console-log.mjs');

function makeDir(root: string, ...segments: string[]) {
  const dir = path.join(root, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-no-console-log', () => {
  it('passes when no console.log() exists in app/ or lib/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nolog-'));
    const dir = makeDir(root, 'app', 'admin', 'test');
    writeFileSync(path.join(dir, 'page.tsx'), 'export default function Page() { console.error("ok"); return null; }');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-console-log] OK');
  });

  it('fails when console.log() is found in app/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nolog-'));
    const dir = makeDir(root, 'app', 'admin', 'test');
    writeFileSync(path.join(dir, 'page.tsx'), 'export default function Page() { console.log("debug"); return null; }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-console-log] FAIL');
    expect(result.stderr).toContain('app/admin/test/page.tsx');
  });

  it('fails when console.log() is found in lib/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nolog-'));
    const dir = makeDir(root, 'lib', 'services');
    writeFileSync(path.join(dir, 'myService.ts'), 'export function foo() { console.log("test"); }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('lib/services/myService.ts');
  });

  it('ignores console.log() inside comment lines', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nolog-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(
      path.join(dir, 'Component.tsx'),
      '// console.log("commented out")\nexport default function C() { return null; }',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-console-log] OK');
  });

  it('ignores test files (.test.tsx)', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nolog-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(path.join(dir, 'Component.test.tsx'), 'console.log("in test");');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-console-log] OK');
  });

  it('reports multiple violations across files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nolog-'));
    const dir1 = makeDir(root, 'app', 'admin', 'bookings');
    writeFileSync(path.join(dir1, 'page.tsx'), 'console.log("a");');
    const dir2 = makeDir(root, 'lib', 'services');
    writeFileSync(path.join(dir2, 'svc.ts'), 'console.log("b");');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('bookings/page.tsx');
    expect(result.stderr).toContain('lib/services/svc.ts');
  });
});
