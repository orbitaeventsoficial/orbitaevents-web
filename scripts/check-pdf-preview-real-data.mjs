#!/usr/bin/env node
/**
 * Guard: les previews PDF de Studio no poden tornar a fixtures inventades.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PREVIEW_DIR = path.join(ROOT, 'app', 'api', 'admin', 'studio', 'preview');
const SERVICE_FILE = path.join(ROOT, 'lib', 'services', 'pdfPreviewService.ts');

const FORBIDDEN_PATTERNS = [
  /Marta/i,
  /Jordi/i,
  /example\.com/i,
  /B-00000000/,
  /00000000X/,
  /ES00 0000/,
  /2026-09-20/,
  /Cardedeu/i,
  /Photobooth/i,
  /Saxofonista/i,
  /Reserva anticipada/i,
  /FAC-2026-001/,
  /CTR-2026-001/,
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    if (entry.isFile() && entry.name.endsWith('.ts')) yield full;
  }
}

const files = [...walk(PREVIEW_DIR), SERVICE_FILE];
const violations = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(lines[i])) {
        violations.push({
          file: path.relative(ROOT, file),
          line: i + 1,
          pattern: String(pattern),
          text: lines[i].trim(),
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log('✓ check-pdf-preview-real-data: previews PDF sense fixtures inventades.');
  process.exit(0);
}

console.error('✗ check-pdf-preview-real-data: dades inventades detectades a previews PDF:\n');
for (const violation of violations) {
  console.error(`  ${violation.file}:${violation.line} ${violation.pattern}`);
  console.error(`    → ${violation.text}`);
}
process.exit(1);
