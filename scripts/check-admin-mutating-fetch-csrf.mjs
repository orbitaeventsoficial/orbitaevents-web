#!/usr/bin/env node
/**
 * qa:admin-mutating-fetch-csrf
 * Bloqueja mutacions natives cap a /api/admin/* dins app/admin.
 *
 * Raó: POST/PATCH/PUT/DELETE admin han de passar per fetchWithCsrf(), que injecta
 * el token CSRF i credentials. Els GETs natius continuen permesos.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = path.join(ROOT, 'app', 'admin');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

const NATIVE_ADMIN_FETCH_RE =
  /(?<![\w$])(?:window\.|globalThis\.)?fetch\s*\(\s*(?<url>`\/api\/admin[^`]*`|'\/api\/admin[^']*'|"\/api\/admin[^"]*")\s*,\s*\{(?<options>[\s\S]*?)\}\s*\)/g;
const METHOD_RE = /\bmethod\s*:\s*['"`](POST|PATCH|PUT|DELETE)['"`]/;

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

function isTestFile(filePath) {
  return filePath.includes('__tests__') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.tsx') ||
    filePath.endsWith('.spec.ts') ||
    filePath.endsWith('.spec.tsx');
}

function lineForIndex(content, index) {
  return content.slice(0, index).split('\n').length;
}

const violations = [];

if (fs.existsSync(SCAN_DIR)) {
  for (const file of walkTs(SCAN_DIR)) {
    if (isTestFile(file)) continue;

    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    for (const match of content.matchAll(NATIVE_ADMIN_FETCH_RE)) {
      const method = METHOD_RE.exec(match.groups?.options ?? '')?.[1];
      if (!method || !MUTATING_METHODS.has(method)) continue;

      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      violations.push(`${rel}:${lineForIndex(content, match.index ?? 0)}: fetch(${match.groups?.url}, method: '${method}')`);
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(`[admin-mutating-fetch-csrf] FAIL: ${violations.length} mutació admin amb fetch natiu detectada:\n`);
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write('\nUsa fetchWithCsrf() de lib/csrf per a POST/PATCH/PUT/DELETE cap a /api/admin/*.\n');
  process.exit(1);
}

console.log('[admin-mutating-fetch-csrf] OK: cap POST/PATCH/PUT/DELETE natiu cap a /api/admin/* a app/admin/.');
