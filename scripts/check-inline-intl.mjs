#!/usr/bin/env node
/**
 * qa:no-inline-intl
 * Verifica que cap component admin construeixi inline:
 *   new Intl.NumberFormat(...)
 *   new Intl.DateTimeFormat(...)
 *
 * Raó: dates, moneda i formats han de passar pels helpers centralitzats de
 * lib/constants/index.ts (formatDate, formatCurrency, formatNumber, formatMonthYearCompact…).
 *
 * Excepcions tècniques:
 *   app/admin/calendario/calendar-utils.ts — helper de calendari propi (monthLabel)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = path.join(ROOT, 'app', 'admin');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);

const ALLOWLIST_SUFFIXES = [
  path.join('app', 'admin', 'calendario', 'calendar-utils.ts'),
];

function isAllowlisted(filePath) {
  return ALLOWLIST_SUFFIXES.some((s) => filePath.endsWith(s));
}

const INTL_RE = /new\s+Intl\.(NumberFormat|DateTimeFormat)\s*\(/g;

function* walkTs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkTs(full);
    } else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      yield full;
    }
  }
}

const violations = [];

if (fs.existsSync(SCAN_DIR)) {
  for (const file of walkTs(SCAN_DIR)) {
    if (isAllowlisted(file)) continue;

    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//')) continue;
      if (INTL_RE.test(line)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
      INTL_RE.lastIndex = 0;
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `[no-inline-intl] FAIL: ${violations.length} Intl inline detectat(s):\n`
  );
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write(
    '\nUsa els helpers centralitzats de lib/constants/index.ts:\n' +
    '  formatDate(date)                        — "24 feb 2026"\n' +
    '  formatDateTime(date)                    — "24 feb 2026, 14:30"\n' +
    '  formatDateShort(date)                   — "24 feb"\n' +
    '  formatCurrency(amount)                  — "1.234 €"\n' +
    '  formatNumber(value, opts)               — generic Intl.NumberFormat\n' +
    '  formatMonthYearCompact(monthIso)        — "feb \'26"\n'
  );
  process.exit(1);
}

console.log('[no-inline-intl] OK: cap new Intl.NumberFormat ni new Intl.DateTimeFormat inline detectat a app/admin/.');
