// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-language-quality.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-language-'));
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

describe('check-language-quality', () => {
  it('passes on clean files', () => {
    const result = runGuard({
      'lib/services/clean.ts': "const label = 'Tasques pendents';\nconst other = \"d'avui\";\n",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Language-quality scan clean');
  });

  it('flags catalan apostrophe inside single-quoted string', () => {
    const result = runGuard({
      'lib/services/broken.ts': "const label = 'Tasques d'avui per revisar';\n",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('CATALAN_APOSTROPHE_IN_SINGLE_QUOTE');
  });

  it('does not flag catalan apostrophe inside double-quoted string', () => {
    const result = runGuard({
      'lib/services/ok.ts': 'const label = "Tasques d\'avui per revisar";\n',
    });
    expect(result.status).toBe(0);
  });

  it('flags wrong catalan plural "respostas" inside string literal', () => {
    const result = runGuard({
      'lib/services/plural.ts': "const label = 'Llista de respostas pendents del client';\n",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('WRONG_CATALAN_PLURAL_S');
  });

  it('flags wrong catalan plural "tascas" inside string literal', () => {
    const result = runGuard({
      'lib/services/plural2.ts': "const label = 'Aquestes tascas son urgents avui';\n",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('WRONG_CATALAN_PLURAL_S');
  });

  it('does not scan __tests__/ directory', () => {
    const result = runGuard({
      '__tests__/lib/foo.test.ts': "const bad = 'Tasques d'avui amb respostas';\n",
    });
    expect(result.status).toBe(0);
  });

  it('does not scan .test. files under app/ or lib/', () => {
    const result = runGuard({
      'lib/services/foo.test.ts': "const bad = 'Tasques d'avui amb respostas';\n",
    });
    expect(result.status).toBe(0);
  });
});
