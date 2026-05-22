// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-th-scope.mjs');

function makeAppDir(root: string, ...segments: string[]) {
  const dir = path.join(root, 'app', ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-th-scope', () => {
  it('passes when all <th> have scope="col"', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-thscope-'));
    const dir = makeAppDir(root, 'admin', 'test');
    writeFileSync(
      path.join(dir, 'Table.tsx'),
      '<table><thead><tr><th scope="col">Nom</th><th scope="col">Estat</th></tr></thead></table>',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[th-scope] OK');
  });

  it('fails when a <th> is missing scope=', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-thscope-'));
    const dir = makeAppDir(root, 'admin', 'reporting');
    writeFileSync(
      path.join(dir, 'page.tsx'),
      '<table><thead><tr><th className="py-2">Origen</th></tr></thead></table>',
    );
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[th-scope] FAIL');
    expect(result.stderr).toContain('app/admin/reporting/page.tsx');
  });

  it('reports all violations across multiple files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-thscope-'));
    const dir1 = makeAppDir(root, 'admin', 'bookings');
    writeFileSync(path.join(dir1, 'page.tsx'), '<th>Data</th>');
    const dir2 = makeAppDir(root, 'admin', 'leads');
    writeFileSync(path.join(dir2, 'page.tsx'), '<th>Estat</th>');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('bookings/page.tsx');
    expect(result.stderr).toContain('leads/page.tsx');
  });

  it('does not flag <thead> or tags that start with th but are not <th>', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-thscope-'));
    const dir = makeAppDir(root, 'admin', 'test');
    writeFileSync(
      path.join(dir, 'Table.tsx'),
      '<thead><tr><th scope="col">X</th></tr></thead>',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[th-scope] OK');
  });

  it('ignores test files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-thscope-'));
    const dir = makeAppDir(root, 'admin', 'test');
    writeFileSync(path.join(dir, 'Table.test.tsx'), '<th>Without scope</th>');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[th-scope] OK');
  });

  it('accepts scope="row" as valid for row headers', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-thscope-'));
    const dir = makeAppDir(root, 'admin', 'test');
    writeFileSync(
      path.join(dir, 'Table.tsx'),
      '<table><tbody><tr><th scope="row">Fila 1</th><td>Valor</td></tr></tbody></table>',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[th-scope] OK');
  });
});
