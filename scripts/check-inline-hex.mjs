#!/usr/bin/env node
/**
 * Guard: zero hex literals hardcoded als components i pàgines de l'admin.
 *
 * Escàner de fitxers .tsx dins app/admin/ que detecta #RRGGBB literals.
 * Exclou fitxers tècnicament legítims (canvas, email-templates, css-manager,
 * color picker, layout PWA meta). CSS i .ts no es processen.
 *
 * Ref CLAUDE.md: "Zero hex hardcoded a components i pàgines, tret dels casos
 * tècnics acceptats: definició de variables globals, canvas, APIs d'imatge,
 * emails HTML."
 */

import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ADMIN_DIR = path.join(ROOT, 'app', 'admin');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'out']);

// Fitxers amb hex legítim per raons tècniques específiques
const ALLOWLIST_SUFFIXES = [
  path.join('app', 'admin', 'canvas'),
  path.join('app', 'admin', 'email-templates'),
  path.join('app', 'admin', 'css-manager'),
  path.join('app', 'admin', 'bookings', '[id]', 'ClientPortalAccessPanel.tsx'),
  path.join('app', 'admin', 'layout.tsx'),
];

// Detecta #[0-9a-fA-F]{6} — exactament 6 dígits hex
const HEX_RE = /#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g;

function isAllowlisted(filePath) {
  const rel = path.relative(ROOT, filePath);
  return ALLOWLIST_SUFFIXES.some((suffix) => rel.startsWith(suffix) || rel === suffix);
}

function* walkTsx(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkTsx(full);
    } else if (entry.name.endsWith('.tsx')) {
      yield full;
    }
  }
}

const violations = [];

for (const file of walkTsx(ADMIN_DIR)) {
  if (isAllowlisted(file)) continue;

  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = [...line.matchAll(HEX_RE)];
    if (matches.length === 0) continue;

    for (const match of matches) {
      violations.push({
        file: path.relative(ROOT, file),
        line: i + 1,
        col: match.index + 1,
        hex: match[0],
        text: line.trim().slice(0, 100),
      });
    }
  }
}

if (violations.length === 0) {
  console.log('✓ check-inline-hex: cap hex literal inline als components admin.');
  process.exit(0);
}

console.error('✗ check-inline-hex: hex literals hardcoded detectats als components admin:\n');
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}:${v.col}  ${v.hex}`);
  console.error(`    → ${v.text}`);
}
console.error(`\nTotal: ${violations.length} violació(ns).`);
console.error('Moure els colors a ADMIN_CHART_COLORS / ADMIN_CHART_SERIES_COLORS');
console.error('o afegir una classe CSS a admin-theme.css si és un fons d\'overlay.');
process.exit(1);
