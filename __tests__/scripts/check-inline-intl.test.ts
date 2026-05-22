import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-inline-intl.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ciintl-test-'));

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

describe('check-inline-intl', () => {
  it('passa quan no hi ha Intl inline', () => {
    const result = runGuard({
      'app/admin/analytics/page.tsx': `
        import { formatCurrency, formatNumber } from '@/lib/constants';
        const label = formatCurrency(1234);
        const fmt = formatNumber(42, { style: 'currency', currency: 'EUR' });
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta new Intl.NumberFormat inline', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        const fmt = new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(v);
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('NumberFormat');
  });

  it('detecta new Intl.DateTimeFormat inline', () => {
    const result = runGuard({
      'app/admin/sales-ops/Panel.tsx': `
        const label = new Intl.DateTimeFormat('ca-ES', { month: 'short' }).format(d);
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('DateTimeFormat');
  });

  it('no marca fitxers de calendar-utils (excepció tècnica)', () => {
    const result = runGuard({
      'app/admin/calendario/calendar-utils.ts': `
        export function monthLabel({ year, month }: MonthYear): string {
          return new Intl.DateTimeFormat('ca-ES', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
        }
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca comentaris', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        // new Intl.NumberFormat('ca-ES') — evitar, usar formatCurrency
        const label = formatCurrency(1234);
      `,
    });
    expect(result.status).toBe(0);
  });

  it('detecta Intl en fitxers .ts (no solo .tsx)', () => {
    const result = runGuard({
      'app/admin/lib/utils.ts': `
        const f = new Intl.DateTimeFormat('ca-ES', { month: 'short', year: '2-digit' });
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('utils.ts');
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard({
      'app/admin/components/A.tsx': `const a = new Intl.NumberFormat('ca-ES').format(v);`,
      'app/admin/components/B.tsx': `const b = new Intl.DateTimeFormat('ca-ES').format(d);`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('A.tsx');
    expect(result.stderr).toContain('B.tsx');
  });

  it('no marca fitxers fora de app/admin', () => {
    const result = runGuard({
      'lib/constants/index.ts': `
        export function formatCurrency(amount: number): string {
          return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
        }
      `,
    });
    expect(result.status).toBe(0);
  });
});
