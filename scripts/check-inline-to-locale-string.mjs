#!/usr/bin/env node
/**
 * qa:no-inline-to-locale-string
 * Verifica que cap component admin faci servir .toLocaleString(...) inline.
 *
 * Raó: moneda, números i datetime han de passar pels helpers centralitzats de
 * lib/constants/index.ts (formatCurrency, formatNumber, formatDateTimeFull...).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = path.join(ROOT, 'app', 'admin');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);
const INLINE_TO_LOCALE_STRING_RE = /\.toLocaleString\s*\(/;

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
      if (INLINE_TO_LOCALE_STRING_RE.test(line)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(`[no-inline-to-locale-string] FAIL: ${violations.length} toLocaleString inline detectat(s):\n`);
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write('\nUsa helpers centralitzats de lib/constants/index.ts: formatCurrency(), formatNumber(), formatDateTimeFull().\n');
  process.exit(1);
}

console.log('[no-inline-to-locale-string] OK: cap .toLocaleString(...) inline detectat a app/admin/.');
