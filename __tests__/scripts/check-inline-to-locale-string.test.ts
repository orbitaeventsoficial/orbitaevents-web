// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-inline-to-locale-string.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citls-test-'));

  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }

  const result = spawnSync('node', [SCRIPT], {
    cwd: tmpDir,
    encoding: 'utf8',
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-inline-to-locale-string', () => {
  it("passa quan s'usen helpers canònics", () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
import { formatCurrency, formatDateTimeFull } from '@/lib/constants';
const amount = formatCurrency(1200);
const date = formatDateTimeFull(new Date());
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta toLocaleString inline', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
const amount = value.toLocaleString('ca-ES');
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('toLocaleString');
    expect(result.stderr).toContain('Widget.tsx');
  });

  it('ignora comentaris', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
// value.toLocaleString('ca-ES') antic
const amount = formatNumber(value);
`,
    });
    expect(result.status).toBe(0);
  });

  it('no escaneja fora de app/admin', () => {
    const result = runGuard({
      'lib/constants/index.ts': `
export function formatNumber(value: number) {
  return value.toLocaleString('ca-ES');
}
`,
    });
    expect(result.status).toBe(0);
  });
});
