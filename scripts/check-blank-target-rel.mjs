#!/usr/bin/env node
/**
 * qa:blank-target-rel
 * Detecta target="_blank" sense rel="noopener noreferrer" i window.open(...,
 * '_blank') sense noopener a fitxers .ts/.tsx de app/ i lib/ (exclou tests i
 * node_modules).
 *
 * Raó: qualsevol link extern obert sense noopener permet a la pàgina destí
 * accedir a window.opener, cosa que facilita atacs de phishing (tabnapping).
 * CLAUDE.md exigeix rel="noopener noreferrer" amb qualsevol target="_blank".
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPES = ['app', 'lib'];
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx']);
const TEST_FILE_PATTERNS = ['.test.', '.spec.'];

/** Context window: quantes línies busquem al voltant de target="_blank" */
const WINDOW = 6;
const WINDOW_OPEN_BLANK_RE = /window\.open\s*\(\s*(?<target>[^,\n]+)\s*,\s*['"]_blank['"]/;
const EMPTY_TARGET_RE = /^\s*['"]{2}\s*$/;

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
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('target="_blank"')) continue;

      // Ignora línies que semblen comentaris
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

      // Comprova finestra de context (±WINDOW línies) per noopener/noreferrer
      const from = Math.max(0, i - WINDOW);
      const to = Math.min(lines.length - 1, i + WINDOW);
      const context = lines.slice(from, to + 1).join('\n');

      if (!context.includes('noopener') && !context.includes('noreferrer')) {
        violations.push({ file: rel, line: i + 1, kind: 'target' });
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('window.open') || !line.includes('_blank')) continue;

      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

      const match = WINDOW_OPEN_BLANK_RE.exec(line);
      if (!match) continue;

      const target = match.groups?.target ?? '';
      if (EMPTY_TARGET_RE.test(target)) continue;
      if (line.includes('noopener') || line.includes('noreferrer')) continue;

      violations.push({ file: rel, line: i + 1, kind: 'window.open' });
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[blank-target-rel] FAIL: ${violations.length} ocurrència(es) de _blank sense noopener/noreferrer:`,
  );
  for (const { file, line, kind } of violations) {
    console.error(`  ${file}:${line} (${kind})`);
  }
  console.error(
    '\nTots els target="_blank" han de portar rel="noopener noreferrer"; window.open(..., "_blank") ha de portar features "noopener,noreferrer" excepte finestres buides controlades.',
  );
  process.exit(1);
}

console.log(
  `[blank-target-rel] OK: ${filesChecked} fitxers revisats, cap target="_blank" sense noopener.`,
);
