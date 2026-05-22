#!/usr/bin/env node
/**
 * qa:no-admin-inline-font-size
 * Verifica que cap component admin usi `fontSize:` amb valor literal (string
 * o número) dins `style={{...}}` de línia única.
 *
 * Raó: CLAUDE.md exigeix zero inline styles evitables. Les mides tipogràfiques
 * han d'usar-se via classes Tailwind (`text-sm`, `text-xs`, `text-[0.7rem]`)
 * o via classes CSS d'admin (`ap-btn--xs`). L'inline `style={{ fontSize: '...' }}`
 * evita la cascada de tokens i dificulta els canvis globals de tipografia.
 *
 * Patrons detectats a fitxers .tsx de app/admin/:
 *   - style={{ fontSize: '0.7rem', ... }}  → ap-btn--xs o text-[0.7rem]
 *   - style={{ fontSize: 12, ... }}        → text-[12px] o classe CSS
 *
 * Excepcions tècniques:
 *   app/admin/canvas/          — editor visual amb estils calculats dinàmicament
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

// fontSize: '...' or fontSize: 12 (numeric) as static inline style
const INLINE_FONT_SIZE_RE = /style=\{[^}]*\bfontSize:\s*(?:'[^']*'|"[^"]*"|\d)/;

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
      if (INLINE_FONT_SIZE_RE.test(line)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `[no-admin-inline-font-size] FAIL: ${violations.length} inline fontSize(s) detectat(s):\n`,
  );
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write(
    '\nSubstitueix per classes CSS o Tailwind:' +
    '\n  fontSize: \'0.7rem\'  →  className="ap-btn--xs"  o  "text-[0.7rem]"' +
    '\n  fontSize: \'0.75rem\' →  className="text-xs"' +
    '\n  fontSize: \'0.875rem\'→  className="text-sm"\n',
  );
  process.exit(1);
}

console.log('[no-admin-inline-font-size] OK: cap inline fontSize detectat a app/admin/.');
