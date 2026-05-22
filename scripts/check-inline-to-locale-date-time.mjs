#!/usr/bin/env node
/**
 * qa:no-inline-to-locale-date-time
 * Verifica que cap component admin faci servir .toLocaleDateString(...) o
 * .toLocaleTimeString(...) inline.
 *
 * Excepció tècnica:
 *   app/admin/calendario/calendar-utils.ts — helper propi del calendari.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = path.join(ROOT, 'app', 'admin');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);
const ALLOWLIST_SUFFIXES = [
  path.join('app', 'admin', 'calendario', 'calendar-utils.ts'),
];
const INLINE_TO_LOCALE_DATE_TIME_RE = /\.toLocale(DateString|TimeString)\s*\(/g;

function isAllowlisted(filePath) {
  return ALLOWLIST_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

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
      if (INLINE_TO_LOCALE_DATE_TIME_RE.test(line)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
      INLINE_TO_LOCALE_DATE_TIME_RE.lastIndex = 0;
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(`[no-inline-to-locale-date-time] FAIL: ${violations.length} toLocaleDateString/toLocaleTimeString inline detectat(s):\n`);
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write('\nUsa helpers centralitzats de lib/constants/index.ts: formatDate*, formatTimeShort(), formatWeekday*().\n');
  process.exit(1);
}

console.log('[no-inline-to-locale-date-time] OK: cap .toLocaleDateString(...) ni .toLocaleTimeString(...) inline detectat a app/admin/.');
