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

  it('flags opaque TypeScript ignore suppressions', () => {
    const result = runGuard({
      'lib/services/ignore.ts': '// @ts-ignore\nexport const value: string = 1;\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('TS_IGNORE_SUPPRESSION');
  });

  it('requires a reason for TypeScript expect-error suppressions', () => {
    const result = runGuard({
      'lib/services/expect-error.ts': '// @ts-expect-error\nexport const value: string = 1;\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('TS_EXPECT_ERROR_WITHOUT_REASON');
  });

  it('allows TypeScript expect-error suppressions with a useful reason', () => {
    const result = runGuard({
      'lib/services/expect-error-reason.ts': [
        '// @ts-expect-error: fixture intentionally breaks the external SDK contract',
        'export const value: string = 1;',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('flags explicit any casts in product code', () => {
    const result = runGuard({
      'lib/services/any-cast.ts': 'export const value = window as any;\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('EXPLICIT_ANY_CAST');
  });

  it('flags explicit any type annotations in product code', () => {
    const result = runGuard({
      'app/example/page.tsx': 'export default function Page(props: any) { return <main>{props.title}</main>; }\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('EXPLICIT_ANY_TYPE');
  });

  it('flags eslint disables without an explanation', () => {
    const result = runGuard({
      'lib/services/eslint-disable.ts': [
        '// eslint-disable-next-line react-hooks/exhaustive-deps',
        'export const value = 1;',
      ].join('\n'),
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ESLINT_DISABLE_WITHOUT_REASON');
  });

  it('allows eslint disables with a reviewable explanation', () => {
    const result = runGuard({
      'lib/services/eslint-disable-reason.ts': [
        '// eslint-disable-next-line react-hooks/exhaustive-deps -- fixture documents why the dependency list is intentionally frozen',
        'export const value = 1;',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('flags double type casts through unknown', () => {
    const result = runGuard({
      'lib/services/cast.ts': 'const value = someObj as unknown as Record<string, unknown>;\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DOUBLE_TYPE_CAST');
  });

  it('does not flag legitimate patterns without double casts', () => {
    const result = runGuard({
      'lib/services/ok-cast.ts': [
        'const a = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;',
        'export const value = 1;',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('flags @ts-nocheck whole-file suppression', () => {
    const result = runGuard({
      'lib/services/nocheck.ts': '// @ts-nocheck\nexport const value = 1;\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('TS_NOCHECK_SUPPRESSION');
  });

  it('does not flag files without @ts-nocheck', () => {
    const result = runGuard({
      'lib/services/clean-types.ts': '// normal comment\nexport const value: number = 1;\n',
    });
    expect(result.status).toBe(0);
  });

  it('flags eval() calls', () => {
    const result = runGuard({
      'lib/services/eval-call.ts': 'const result = eval(userInput);\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('EVAL_CALL');
  });

  it('flags new Function() calls', () => {
    const result = runGuard({
      'lib/services/new-func.ts': 'const fn = new Function("x", "return x + 1");\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('EVAL_CALL');
  });

  it('does not flag eval in comments', () => {
    const result = runGuard({
      'lib/services/eval-comment.ts': '// eval() was removed\nexport const value = 1;\n',
    });
    expect(result.status).toBe(0);
  });

  it('flags $queryRawUnsafe calls', () => {
    const result = runGuard({
      'lib/services/raw-sql.ts': 'const rows = await prisma.$queryRawUnsafe(sql, ...args);\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('RAW_SQL_UNSAFE');
  });

  it('flags $executeRawUnsafe calls', () => {
    const result = runGuard({
      'lib/services/exec-sql.ts': 'await prisma.$executeRawUnsafe("UPDATE bookings SET status = ?", val);\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('RAW_SQL_UNSAFE');
  });

  it('does not flag safe $queryRaw tagged template', () => {
    const result = runGuard({
      'lib/services/safe-sql.ts': 'const rows = await prisma.$queryRaw`SELECT 1`;\n',
    });
    expect(result.status).toBe(0);
  });

  it('flags throw with single-quote string literal', () => {
    const result = runGuard({
      'lib/services/bad-throw.ts': "export function fail() { throw 'something went wrong'; }\n",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('THROW_STRING_LITERAL');
  });

  it('flags throw with template literal', () => {
    const result = runGuard({
      'lib/services/bad-throw2.ts': 'export function fail(id: string) { throw `not found: ${id}`; }\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('THROW_STRING_LITERAL');
  });

  it('does not flag throw new Error(...)', () => {
    const result = runGuard({
      'lib/services/good-throw.ts': "export function fail() { throw new Error('something went wrong'); }\n",
    });
    expect(result.status).toBe(0);
  });
});
