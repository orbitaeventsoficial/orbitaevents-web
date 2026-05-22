// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-console-debug.mjs');

function makeDir(root: string, ...segments: string[]) {
  const dir = path.join(root, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-no-console-debug', () => {
  it('passes when no console.debug/info exists in app/ or lib/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nodebug-'));
    const dir = makeDir(root, 'app', 'admin', 'test');
    writeFileSync(
      path.join(dir, 'page.tsx'),
      'export default function Page() { console.error("ok"); console.warn("ok"); return null; }',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-console-debug] OK');
  });

  it('fails when console.debug() is found in app/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nodebug-'));
    const dir = makeDir(root, 'app', 'admin', 'test');
    writeFileSync(path.join(dir, 'page.tsx'), 'console.debug("trace data");');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-console-debug] FAIL');
    expect(result.stderr).toContain('app/admin/test/page.tsx');
  });

  it('fails when console.info() is found in lib/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nodebug-'));
    const dir = makeDir(root, 'lib', 'services');
    writeFileSync(path.join(dir, 'myService.ts'), 'export function foo() { console.info("started"); }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('lib/services/myService.ts');
  });

  it('ignores console.debug/info inside comment lines', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nodebug-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(
      path.join(dir, 'Component.tsx'),
      '// console.debug("old debug")\nexport default function C() { return null; }',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-console-debug] OK');
  });

  it('ignores test files (.test.tsx)', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nodebug-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(path.join(dir, 'Component.test.tsx'), 'console.debug("in test");');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-console-debug] OK');
  });

  it('ignores lib/logger.ts (canonical logger)', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nodebug-'));
    const dir = makeDir(root, 'lib');
    writeFileSync(path.join(dir, 'logger.ts'), 'console.debug("level: debug"); console.info("level: info");');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-console-debug] OK');
  });

  it('reports multiple violations across files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-nodebug-'));
    const dir1 = makeDir(root, 'app', 'admin', 'bookings');
    writeFileSync(path.join(dir1, 'page.tsx'), 'console.debug("a");');
    const dir2 = makeDir(root, 'lib', 'services');
    writeFileSync(path.join(dir2, 'svc.ts'), 'console.info("b");');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('bookings/page.tsx');
    expect(result.stderr).toContain('lib/services/svc.ts');
  });
});
