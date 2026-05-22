#!/usr/bin/env node
/**
 * qa:no-silent-catch
 * Detects catch blocks in app/admin/ that show user-facing errors (toast.error,
 * setFlash, setFlashMessage) but omit console.error/log.error.
 * CLAUDE.md: "Tot catch ha de tenir console.error() mínim."
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const SCAN_DIR = path.join(repoRoot, 'app', 'admin');

const UI_ERROR_RE = [/toast\.error\s*\(/, /setFlash\s*\(/, /setFlashMessage\s*\(/];
const LOGGING_RE = [/console\.error\s*\(/, /log\.error\s*\(/];

function walkDir(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkDir(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function extractCatchBlocks(source) {
  const blocks = [];
  const re = /\bcatch\s*(?:\([^)]*\))?\s*\{/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const openIdx = m.index + m[0].length - 1;
    let depth = 1, j = openIdx + 1;
    while (j < source.length && depth > 0) {
      if (source[j] === '{') depth++;
      else if (source[j] === '}') depth--;
      j++;
    }
    const body = source.slice(openIdx + 1, j - 1);
    const line = source.slice(0, m.index).split('\n').length;
    blocks.push({ body, line });
  }
  return blocks;
}

const violations = [];

for (const file of walkDir(SCAN_DIR)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const block of extractCatchBlocks(source)) {
    if (!UI_ERROR_RE.some((p) => p.test(block.body))) continue;
    if (!LOGGING_RE.some((p) => p.test(block.body))) {
      violations.push(`  ${path.relative(repoRoot, file)}:${block.line}`);
    }
  }
}

if (violations.length === 0) {
  process.stdout.write('[no-silent-catch] OK\n');
  process.exit(0);
} else {
  process.stderr.write(`[no-silent-catch] FAIL — ${violations.length} silent catch block(s):\n`);
  for (const v of violations) process.stderr.write(v + '\n');
  process.stderr.write('\nEach catch block with user-facing errors must call console.error() or log.error().\n');
  process.exit(1);
}
