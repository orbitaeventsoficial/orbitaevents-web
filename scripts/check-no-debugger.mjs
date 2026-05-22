#!/usr/bin/env node
/**
 * qa:no-debugger
 * Detecta sentències `debugger;` a fitxers de producció (app/ i lib/).
 *
 * Raó: `debugger;` atura l'execució del motor JS quan les DevTools estan
 * obertes. En producció causa una aturada visible per qualsevol usuari amb
 * DevTools obert. Com console.log(), és sempre un artefacte de debugging que
 * mai ha d'arribar al repo en fitxers de producció.
 *
 * Excepcions acceptades: scripts/, prisma/, __tests__/ (fora de l'abast).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPES = ['app', 'lib'];
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const TEST_FILE_PATTERNS = ['.test.', '.spec.'];

function* walkDir(dir) {
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
      yield* walkDir(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;
      if (TEST_FILE_PATTERNS.some((p) => entry.name.includes(p))) continue;
      yield full;
    }
  }
}

const violations = [];
let filesChecked = 0;

for (const scope of SCOPES) {
  const scopeDir = path.join(ROOT, scope);
  if (!fs.existsSync(scopeDir)) continue;
  for (const file of walkDir(scopeDir)) {
    filesChecked++;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf-8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/\bdebugger\b/.test(line)) continue;

      // Ignora línies que són comentaris
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

      violations.push({ file: rel, line: i + 1, sample: trimmed.slice(0, 120) });
    }
  }
}

if (violations.length > 0) {
  console.error(`[no-debugger] FAIL: ${violations.length} sentència(es) debugger detectades:`);
  for (const { file, line, sample } of violations) {
    console.error(`  ${file}:${line}  ${sample}`);
  }
  console.error('\nElimina totes les sentències `debugger;` abans de fer commit.');
  process.exit(1);
}

console.log(`[no-debugger] OK: ${filesChecked} fitxers revisats, cap debugger de producció.`);
