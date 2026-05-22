#!/usr/bin/env node
/**
 * qa:no-native-dialog
 * Detecta crides a alert(), window.confirm() i window.prompt() a fitxers de
 * producció (app/ i lib/).
 *
 * Raó: CLAUDE.md prohibeix explícitament alert() i window.confirm(). Els
 * diàlegs de confirmació han d'usar el hook useConfirmDialog() que proporciona
 * UX consistent, accessible i cancel·lable. Les crides natives bloquegen el
 * fil principal i queden fora del sistema de disseny.
 *
 * Patrons detectats:
 *   - alert(       → sempre prohibit
 *   - window.alert( → sempre prohibit
 *   - window.confirm( → sempre prohibit
 *   - window.prompt( → sempre prohibit
 *   - confirm('...  → confirm amb argument string (no el hook useConfirmDialog)
 *   - confirm(`...  → idem amb template literal
 *
 * NO detecta confirm({ → és l'ús correcte del hook useConfirmDialog.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPES = ['app', 'lib'];
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const TEST_FILE_PATTERNS = ['.test.', '.spec.'];

// Patrons que detecten crides natives prohibides.
// confirm({  és el hook i NO es detecta (el { evita el match de ['"`]).
const FORBIDDEN_PATTERNS = [
  /\balert\s*\(/,
  /\bwindow\s*\.\s*alert\s*\(/,
  /\bwindow\s*\.\s*confirm\s*\(/,
  /\bwindow\s*\.\s*prompt\s*\(/,
  /\bconfirm\s*\(\s*['"`]/,
];

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
      // Ignora línies de comentari
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({ file: rel, line: i + 1, sample: trimmed.slice(0, 120) });
          break;
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`[no-native-dialog] FAIL: ${violations.length} crida(es) a diàleg natiu detectades:`);
  for (const { file, line, sample } of violations) {
    console.error(`  ${file}:${line}  ${sample}`);
  }
  console.error('\nSubstitueix alert()/confirm()/prompt() per useConfirmDialog() — CLAUDE.md "Diàlegs".');
  process.exit(1);
}

console.log(`[no-native-dialog] OK: ${filesChecked} fitxers revisats, cap diàleg natiu.`);
