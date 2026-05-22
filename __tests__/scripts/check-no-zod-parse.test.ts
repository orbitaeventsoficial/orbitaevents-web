// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-zod-parse.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-nozodparse-'));
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

const safeRoute = [
  'import { z } from "zod";',
  'const schema = z.object({ id: z.string() });',
  'const parsed = schema.safeParse(body);',
  'if (!parsed.success) return Response.json({ error: "INVALID_BODY" }, { status: 400 });',
  'const { id } = parsed.data;',
].join('\n');

const parseRoute = [
  'import { z } from "zod";',
  'const schema = z.object({ id: z.string() });',
  'const { id } = schema.parse(body);',
].join('\n');

describe('check-no-zod-parse', () => {
  it('passes when no app/api directory exists', () => {
    const result = runGuard({
      'lib/services/foo.ts': 'export const value = 1;\n',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-zod-parse] OK');
  });

  it('passes when all API routes use .safeParse()', () => {
    const result = runGuard({
      'app/api/admin/items/route.ts': safeRoute,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-zod-parse] OK');
  });

  it('flags .parse() in an API route', () => {
    const result = runGuard({
      'app/api/admin/items/route.ts': parseRoute,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[no-zod-parse] FAIL');
    expect(result.stderr).toContain('schema.parse(body)');
  });

  it('does not flag JSON.parse() in API routes', () => {
    const result = runGuard({
      'app/api/admin/items/route.ts': [
        'const raw = JSON.parse(text);',
        'export const value = 1;',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('does not flag .parse() in commented lines', () => {
    const result = runGuard({
      'app/api/admin/items/route.ts': [
        '// schema.parse(body) was here',
        'export const value = 1;',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('does not flag files outside app/api/', () => {
    const result = runGuard({
      'lib/services/foo.ts': parseRoute,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-zod-parse] OK');
  });

  it('does not flag test files inside app/api/', () => {
    const result = runGuard({
      'app/api/admin/items/route.test.ts': parseRoute,
    });
    expect(result.status).toBe(0);
  });

  it('reports multiple violations with file and line', () => {
    const result = runGuard({
      'app/api/admin/a/route.ts': parseRoute,
      'app/api/admin/b/route.ts': parseRoute,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/api/admin/a/route.ts');
    expect(result.stderr).toContain('app/api/admin/b/route.ts');
  });
});
