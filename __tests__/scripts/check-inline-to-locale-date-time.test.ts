// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-inline-to-locale-date-time.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citldt-test-'));

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

describe('check-inline-to-locale-date-time', () => {
  it('passa quan s’usen helpers canònics', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
import { formatDateShort, formatTimeShort } from '@/lib/constants';
const day = formatDateShort(date);
const time = formatTimeShort(date);
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta toLocaleDateString inline', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
const day = date.toLocaleDateString('ca-ES');
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('toLocaleDateString');
  });

  it('detecta toLocaleTimeString inline', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
const time = date.toLocaleTimeString('ca-ES');
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('toLocaleTimeString');
  });

  it('permet calendar-utils com a helper tècnic', () => {
    const result = runGuard({
      'app/admin/calendario/calendar-utils.ts': `
export function formatCalendarTime(date: Date) {
  return date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}
`,
    });
    expect(result.status).toBe(0);
  });
});
