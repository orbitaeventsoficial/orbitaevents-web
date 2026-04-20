// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-task-canonical.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-canonical-'));
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

describe('check-task-canonical — inline-dedupe-template rule', () => {
  it('accepts canonical dedupeKey via TASK_DEDUPE_KEY helper', () => {
    const result = runGuard({
      'lib/services/foo.ts': `import { TASK_DEDUPE_KEY } from '@/lib/constants';\nconst dk = { dedupeKey: TASK_DEDUPE_KEY.welcomeEmail(id) };\n`,
    });
    expect(result.status).toBe(0);
  });

  it('rejects inline template-literal dedupeKey in lib/', () => {
    const result = runGuard({
      'lib/services/foo.ts': 'const dk = { dedupeKey: `welcome-email:${leadId}` };\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('inline-dedupe-template');
  });

  it('rejects inline template-literal dedupeKey in app/', () => {
    const result = runGuard({
      'app/api/foo/route.ts': 'const dk = { dedupeKey: `reactivation:${customerId}` };\n',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('inline-dedupe-template');
  });

  it('does not flag inline dedupeKey inside __tests__/', () => {
    const result = runGuard({
      '__tests__/lib/foo.test.ts': 'expect(args.dedupeKey).toBe(`welcome-email:${id}`);\n',
    });
    expect(result.status).toBe(0);
  });

  it('does not flag static string dedupeKey (no template interpolation)', () => {
    const result = runGuard({
      'lib/services/foo.ts': "const dk = { dedupeKey: 'welcome-email:l1' };\n",
    });
    expect(result.status).toBe(0);
  });
});
