#!/usr/bin/env node
/**
 * qa:no-admin-slate-gray
 * Verifica que cap component admin faci servir classes Tailwind `slate-N` o `gray-N`.
 *
 * Raó (CLAUDE.md §CSS architecture admin):
 *   "Colors: sistema white/opacity sobre fons fosc. MAI slate-*, gray-*, ni hex custom als components."
 *   El sistema admin usa `bg-white/[0.06]`, `text-white/60`, `border-white/15`, etc.
 *   `slate-*` i `gray-*` trenquen la coherència visual del tema fosc.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = path.join(ROOT, 'app', 'admin');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);

const SLATE_GRAY_RE = /(?:^|[\s'"`{(])(?:[a-z]+:)*(?:[a-z]+-)?(?:slate|gray)-\d/;

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
      if (SLATE_GRAY_RE.test(line)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(`[no-admin-slate-gray] FAIL: ${violations.length} ús(os) de slate-*/gray-* detectat(s) a app/admin/:\n`);
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write('\nUsa el sistema white/opacity: text-white/60, bg-white/[0.06], border-white/15, etc.\n');
  process.exit(1);
}

console.log('[no-admin-slate-gray] OK: cap slate-*/gray-* detectat a app/admin/.');
