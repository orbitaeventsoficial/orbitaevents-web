#!/usr/bin/env node
/**
 * qa:no-admin-inline-font-styles
 * Verifica que cap component admin usi propietats tipogràfiques com
 * `fontFamily:` o `fontVariantNumeric:` dins `style={{...}}`.
 *
 * Raó: CLAUDE.md exigeix zero inline styles evitables. Les classes Tailwind
 * equivalents (`font-mono`, `tabular-nums`) apliquen els mateixos tokens
 * sense `style={{`.
 *
 * Patrons detectats a fitxers .tsx de app/admin/:
 *   - style={{ ... fontFamily: ...   → usar `font-mono`, `font-sans`, etc.
 *   - style={{ ... fontVariantNumeric: ... → usar `tabular-nums`, etc.
 *
 * Excepció tècnica:
 *   app/admin/canvas/  — editor visual amb estils calculats dinàmicament
 *   app/admin/email-templates/ — HTML d'email requereix estils inline
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIR = path.join(ROOT, 'app', 'admin');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '__tests__']);

const ALLOWLIST_PREFIXES = [
  path.join(ROOT, 'app', 'admin', 'canvas'),
  path.join(ROOT, 'app', 'admin', 'email-templates'),
];

const INLINE_FONT_FAMILY_RE = /style=\{[^}]*fontFamily\s*:/;
const INLINE_FONT_VARIANT_RE = /style=\{[^}]*fontVariantNumeric\s*:/;

function isAllowlisted(filePath) {
  return ALLOWLIST_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function* walkTsx(dir) {
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
      yield* walkTsx(full);
    } else if (entry.isFile() && full.endsWith('.tsx')) {
      yield full;
    }
  }
}

const violations = [];

if (fs.existsSync(SCAN_DIR)) {
  for (const file of walkTsx(SCAN_DIR)) {
    if (isAllowlisted(file)) continue;
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
      if (INLINE_FONT_FAMILY_RE.test(line) || INLINE_FONT_VARIANT_RE.test(line)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `[no-admin-inline-font-styles] FAIL: ${violations.length} inline font style(s) detectat(s):\n`,
  );
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write(
    '\nSubstitueix per classes Tailwind:' +
    '\n  fontFamily: "var(--font-mono, monospace)"  →  className="font-mono"' +
    '\n  fontVariantNumeric: "tabular-nums"         →  className="tabular-nums"\n',
  );
  process.exit(1);
}

console.log('[no-admin-inline-font-styles] OK: cap inline fontFamily ni fontVariantNumeric detectat a app/admin/.');
