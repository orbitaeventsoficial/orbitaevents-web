// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-patches.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-patches-'));
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

describe('check-patches', () => {
  it('passes on clean files', () => {
    const result = runGuard({
      'app/example/page.tsx': 'export default function Page() { return <main>Net</main>; }',
      'lib/services/clean.ts': 'export function ok() { return true; }',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Patch-smell scan clean');
  });

  it('flags line TODO markers', () => {
    const result = runGuard({
      'lib/services/todo.ts': '// TODO: arreglar mes tard\nexport const value = 1;\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('TODO_MARKER');
  });

  it('flags block TODO markers', () => {
    const result = runGuard({
      'lib/services/block-todo.ts': '/* TODO: parche temporal */\nexport const value = 1;\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('TODO_MARKER');
  });

  it('skips test files', () => {
    const result = runGuard({
      'lib/services/foo.test.ts': '// TODO: fixture pendent\nexport const value = 1;\n',
      '__tests__/lib/foo.ts': 'catch (error) {}\n',
    });
    expect(result.status).toBe(0);
  });
});
