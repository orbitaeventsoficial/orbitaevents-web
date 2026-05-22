#!/usr/bin/env node
/**
 * qa:no-console-debug
 * Detecta crides a console.debug() i console.info() a fitxers de producció.
 *
 * Raó: console.debug() i console.info() són artefactes de debugging igual que
 * console.log(). En producció, els missatges d'error han d'usar console.error()
 * i els d'advertència console.warn() (CLAUDE.md: "Tot catch ha de tenir
 * console.error() mínim"). console.debug() i console.info() no aporten
 * informació útil a producció i poden filtrar informació sensible als logs.
 *
 * Excepció acceptada: lib/logger.ts (logger canònic del repo, que utilitza
 * console.debug/info internament per als seus nivells de log).
 * Excepció acceptada: scripts/, prisma/, __tests__/ (fora de l'abast).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPES = ['app', 'lib'];
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const TEST_FILE_PATTERNS = ['.test.', '.spec.'];

// logger.ts és el logger canònic del repo: té permís per cridar console.debug/info
const ALLOWED_FILES = new Set(['lib/logger.ts']);

const FORBIDDEN_PATTERNS = [
  /\bconsole\.debug\s*\(/,
  /\bconsole\.info\s*\(/,
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

    if (ALLOWED_FILES.has(rel)) continue;

    const lines = fs.readFileSync(file, 'utf-8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

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
  console.error(`[no-console-debug] FAIL: ${violations.length} crida(es) a console.debug/info detectades:`);
  for (const { file, line, sample } of violations) {
    console.error(`  ${file}:${line}  ${sample}`);
  }
  console.error('\nElimina els console.debug/info o substitueix-los per console.error()/console.warn() si cal registrar-ho.');
  process.exit(1);
}

console.log(`[no-console-debug] OK: ${filesChecked} fitxers revisats, cap console.debug/info de producció.`);
