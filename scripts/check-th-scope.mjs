#!/usr/bin/env node
/**
 * qa:th-scope
 * Detecta elements <th> sense atribut scope= a fitxers .tsx de app/ i lib/.
 *
 * Raó: l'atribut scope="col" (o scope="row") és obligatori per accessibilitat
 * (WCAG 1.3.1, CLAUDE.md regles d'accessibilitat). Sense scope, els lectors
 * de pantalla no poden associar la capçalera amb les cel·les corresponents.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPES = ['app', 'lib'];
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);
const ALLOWED_EXTENSIONS = new Set(['.tsx']);
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

function findThWithoutScope(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  // Match <th followed by whitespace or > (avoids matching <thead, <th-custom, etc.)
  // Lazily capture to first > to get the opening tag
  const pattern = /<th(?=[\s>])[^]*?>/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const tag = match[0];
    if (tag.includes('scope=')) continue;

    // Skip lines that are comments
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const linePrefix = content.slice(lineStart, match.index).trimStart();
    if (linePrefix.startsWith('//') || linePrefix.startsWith('*') || linePrefix.startsWith('/*')) continue;

    const lineNum = content.slice(0, match.index).split('\n').length;
    violations.push({ line: lineNum, tag: tag.slice(0, 100) });
  }
  return violations;
}

const violations = [];
let filesChecked = 0;

for (const scope of SCOPES) {
  const scopeDir = path.join(ROOT, scope);
  if (!fs.existsSync(scopeDir)) continue;
  for (const file of walkDir(scopeDir)) {
    filesChecked++;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const fileViolations = findThWithoutScope(file);
    for (const v of fileViolations) {
      violations.push({ file: rel, ...v });
    }
  }
}

if (violations.length > 0) {
  console.error(`[th-scope] FAIL: ${violations.length} <th> sense scope= detectades:`);
  for (const { file, line, tag } of violations) {
    console.error(`  ${file}:${line}  ${tag}`);
  }
  console.error("\nTots els <th> han de portar scope=\"col\" o scope=\"row\" — CLAUDE.md regles d'accessibilitat.");
  process.exit(1);
}

console.log(`[th-scope] OK: ${filesChecked} fitxers revisats, tots els <th> porten scope=.`);
