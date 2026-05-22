// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-short-locale-literals.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-short-locale-'));
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

describe('check-short-locale-literals', () => {
  it('passa amb locale omès o normalitzat pels helpers canònics', () => {
    const result = runGuard({
      'app/admin/packs/page.tsx': [
        "formatCurrency(total);",
        "formatDateSimple(date);",
        "new Intl.NumberFormat(toIntlLocale(locale)).format(total);",
        "new Intl.DateTimeFormat(DEFAULT_LOCALE).format(date);",
      ].join('\n'),
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-short-locale-literals] OK');
  });

  it('falla amb locale curt a formatCurrency', () => {
    const result = runGuard({
      'app/admin/packs/[id]/page.tsx': "formatCurrency(total, 'ca');",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('SHORT_LOCALE_SHARED_FORMATTER');
    expect(result.stderr).toContain("formatCurrency(total, 'ca'");
  });

  it('falla amb locale curt a formatDateSimple', () => {
    const result = runGuard({
      'app/admin/packs/[id]/page.tsx': "formatDateSimple(eventDate, 'ca');",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('SHORT_LOCALE_SHARED_FORMATTER');
    expect(result.stderr).toContain("formatDateSimple(eventDate, 'ca'");
  });

  it('falla amb locale curt a Intl directe', () => {
    const result = runGuard({
      'lib/services/report.ts': "new Intl.NumberFormat('es', { style: 'currency', currency: 'EUR' }).format(total);",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('SHORT_LOCALE_INTL');
    expect(result.stderr).toContain("new Intl.NumberFormat('es'");
  });

  it('permet definicions dins lib/constants/index.ts', () => {
    const result = runGuard({
      'lib/constants/index.ts': "export function formatCurrency(amount, locale = 'ca') { return amount; }",
      'app/admin/page.tsx': 'formatCurrency(total);',
    });

    expect(result.status).toBe(0);
  });
});
