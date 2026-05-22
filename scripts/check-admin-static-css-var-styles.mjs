#!/usr/bin/env node
/**
 * qa:no-admin-static-css-var-styles
 * Verifica que cap component admin usi variables CSS d'admin-theme com a valors
 * estàtics directes dins `style={{...}}` en props de línia única.
 *
 * Raó: CLAUDE.md exigeix zero inline styles evitables. Les variables `--at-*`
 * han d'usar-se via classes Tailwind arbitràries (`text-[var(--at-text)]`,
 * `bg-[var(--at-surface)]`, `border-[var(--at-border)]`), no com a strings
 * literals en `style={{}}`.
 *
 * Patrons detectats a fitxers .tsx de app/admin/:
 *   - style={{ color: 'var(--at-...)' }}           → text-[var(--at-...)]
 *   - style={{ background: 'var(--at-...)' }}       → bg-[var(--at-...)]
 *   - style={{ borderBottom: '1px solid var(--...) }}  → border-b border-[var(--...)]
 *   - style={{ borderTop: '1px solid var(--...)' }} → border-t border-[var(--...)]
 *
 * Nota: detecta únicament props `style={{...}}` de línia única. Els objectes
 * d'estil multilínia amb color-mix() o lògica condicional queden exclosos
 * del scope (no hi ha Tailwind equivalent directe).
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

// color: 'var(--at-...)' — value is directly a CSS variable string
const STATIC_COLOR_RE = /style=\{[^}]*\bcolor:\s*'var\(--/;

// background: 'var(--at-...)' — direct CSS var, not color-mix() etc.
const STATIC_BG_RE = /style=\{[^}]*\bbackground(?:Color)?:\s*'var\(--/;

// border[Bottom|Top|Left|Right|Color]: '...var(--...)' — shorthand or color with CSS var
const STATIC_BORDER_RE = /style=\{[^}]*\bborder(?:Bottom|Top|Left|Right|Color)?:\s*'[^']*var\(--/;

const ALL_RES = [STATIC_COLOR_RE, STATIC_BG_RE, STATIC_BORDER_RE];

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
      if (ALL_RES.some((re) => re.test(line))) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `[no-admin-static-css-var-styles] FAIL: ${violations.length} static CSS var style(s) detectat(s):\n`,
  );
  for (const v of violations) {
    process.stderr.write(`  ${v}\n`);
  }
  process.stderr.write(
    '\nSubstitueix per classes Tailwind arbitràries:' +
    '\n  color: \'var(--at-text)\'             →  className="text-[var(--at-text)]"' +
    '\n  background: \'var(--at-surface)\'      →  className="bg-[var(--at-surface)]"' +
    '\n  borderBottom: \'1px solid var(--...\' →  className="border-b border-[var(--...)]"\n',
  );
  process.exit(1);
}

console.log('[no-admin-static-css-var-styles] OK: cap static CSS var en style={{}} detectat a app/admin/.');
