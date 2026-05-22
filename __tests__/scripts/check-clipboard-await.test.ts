// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const SCRIPT = path.resolve('scripts/check-clipboard-await.mjs');

function runGuard(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-clipboard-await-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return spawnSync(process.execPath, [SCRIPT], { cwd: root, encoding: 'utf8' });
}

describe('check-clipboard-await', () => {
  it('passa quan la còpia admin fa await', () => {
    const result = runGuard({
      'app/admin/leads/Copy.tsx': 'await navigator.clipboard.writeText(message);',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('falla quan la còpia admin no espera la Promise', () => {
    const result = runGuard({
      'app/admin/scripts/ScriptsClient.tsx': 'navigator.clipboard.writeText(cmd);',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ScriptsClient.tsx');
  });

  it('ignora comentaris', () => {
    const result = runGuard({
      'app/admin/scripts/ScriptsClient.tsx': '// navigator.clipboard.writeText(cmd);',
    });

    expect(result.status).toBe(0);
  });

  it('ignora fora de app/admin', () => {
    const result = runGuard({
      'app/components/PublicCopy.tsx': 'navigator.clipboard.writeText(cmd);',
    });

    expect(result.status).toBe(0);
  });
});
