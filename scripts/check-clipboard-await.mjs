#!/usr/bin/env node
/**
 * qa:clipboard-await
 * Verifica que les escriptures al porta-retalls admin es facin amb await.
 *
 * Raó: navigator.clipboard.writeText() retorna Promise i pot fallar per permisos
 * o context no segur. Si no s'espera, la UI pot mostrar èxit fals i generar
 * rejections silencioses.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = path.join(ROOT, 'app', 'admin');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);
const CLIPBOARD_WRITE_RE = /navigator\.clipboard\.writeText\s*\(/;
const AWAITED_CLIPBOARD_WRITE_RE = /\bawait\s+navigator\.clipboard\.writeText\s*\(/;

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
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
      if (CLIPBOARD_WRITE_RE.test(line) && !AWAITED_CLIPBOARD_WRITE_RE.test(line)) {
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(`[clipboard-await] FAIL: ${violations.length} clipboard write sense await detectat(s):\n`);
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write('\nUsa await navigator.clipboard.writeText(...) dins try/catch abans de mostrar èxit de còpia.\n');
  process.exit(1);
}

console.log('[clipboard-await] OK: totes les còpies admin esperen navigator.clipboard.writeText().');
