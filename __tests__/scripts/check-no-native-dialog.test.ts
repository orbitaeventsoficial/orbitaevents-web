// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-native-dialog.mjs');

function makeDir(root: string, ...segments: string[]) {
  const dir = path.join(root, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-no-native-dialog', () => {
  it('passes when no native dialog calls exist', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-dialog-'));
    const dir = makeDir(root, 'app', 'admin', 'social');
    writeFileSync(
      path.join(dir, 'SocialClient.tsx'),
      'const ok = await confirm({ title: "Delete", message: "Sure?", variant: "danger" });',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-native-dialog] OK');
  });

  it('fails when confirm() is called with a string argument', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-dialog-'));
    const dir = makeDir(root, 'app', 'admin', 'social');
    writeFileSync(
      path.join(dir, 'Component.tsx'),
      "if (!confirm('Segur?')) return;",
    );
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-native-dialog] FAIL');
    expect(result.stderr).toContain('app/admin/social/Component.tsx');
  });

  it('fails when window.confirm() is used', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-dialog-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(path.join(dir, 'page.tsx'), 'window.confirm("Are you sure?");');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('window.confirm');
  });

  it('fails when alert() is used', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-dialog-'));
    const dir = makeDir(root, 'lib', 'services');
    writeFileSync(path.join(dir, 'svc.ts'), 'alert("Error occurred");');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('lib/services/svc.ts');
  });

  it('ignores native dialog calls in comment lines', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-dialog-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(
      path.join(dir, 'Component.tsx'),
      "// confirm('old code — removed')\nexport default function C() { return null; }",
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-native-dialog] OK');
  });

  it('ignores test files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-dialog-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(path.join(dir, 'Component.test.tsx'), "confirm('in test');");
    const result = run(root);
    expect(result.status).toBe(0);
  });

  it('does not flag the useConfirmDialog hook pattern confirm({...})', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-dialog-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(
      path.join(dir, 'Component.tsx'),
      "const ok = await confirm({ title: 'Del', message: 'Sure?', confirmLabel: 'Delete', variant: 'danger' });",
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-native-dialog] OK');
  });
});
