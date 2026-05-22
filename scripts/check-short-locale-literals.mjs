#!/usr/bin/env node
// qa:no-short-locale-literals - evita locales curts ('ca'/'es'/'en') en formatters Intl compartits.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'lib'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SHORT_LOCALE = String.raw`['"](ca|es|en)['"]`;

const SHARED_FORMATTERS = [
  'formatCurrency',
  'formatCurrencyExact',
  'formatDateSimple',
  'formatDateLong',
  'formatDateFull',
  'formatDateTime',
  'formatTime',
  'formatNumber',
  'formatMonthYearCompact',
];

const CHECKS = [
  {
    code: 'SHORT_LOCALE_SHARED_FORMATTER',
    regex: new RegExp(String.raw`\b(?:${SHARED_FORMATTERS.join('|')})\s*\([^;\n]*,\s*${SHORT_LOCALE}`, 'g'),
    message: 'usa locale curt en un formatter compartit; omet el locale a admin o passa locale complet via toIntlLocale',
  },
  {
    code: 'SHORT_LOCALE_INTL',
    regex: new RegExp(String.raw`\bnew\s+Intl\.(?:NumberFormat|DateTimeFormat)\s*\(\s*${SHORT_LOCALE}`, 'g'),
    message: 'usa locale curt directament a Intl; passa per toIntlLocale(locale) o DEFAULT_LOCALE',
  },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'coverage'].includes(entry.name)) continue;
      walk(absolute, files);
      continue;
    }
    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolute);
    }
  }
  return files;
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = relative(file);
    if (rel === 'lib/constants/index.ts') continue;

    const text = fs.readFileSync(file, 'utf8');
    for (const check of CHECKS) {
      for (const match of text.matchAll(check.regex)) {
        violations.push({
          file: rel,
          line: lineNumberForIndex(text, match.index ?? 0),
          code: check.code,
          message: check.message,
          snippet: match[0].trim(),
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log('[no-short-locale-literals] OK: cap locale curt en formatters compartits ni Intl directe.');
  process.exit(0);
}

process.stderr.write(`[no-short-locale-literals] FAIL — ${violations.length} violació(ns)\n`);
for (const violation of violations) {
  process.stderr.write(`  ${violation.file}:${violation.line} ${violation.code} — ${violation.message}\n`);
  process.stderr.write(`    ${violation.snippet}\n`);
}
process.exit(1);
