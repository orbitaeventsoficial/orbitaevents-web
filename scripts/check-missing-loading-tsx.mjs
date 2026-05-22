#!/usr/bin/env node
/**
 * qa:missing-loading-tsx
 * Verifica que tot directori de app/admin/ que contingui un page.tsx
 * tingui també un loading.tsx al mateix directori.
 *
 * Raó: sense loading.tsx, Next.js App Router no pot mostrar un skeleton
 * mentre carrega dades del servidor, deixant l'usuari amb un blanc.
 * CLAUDE.md exigeix: "loading.tsx — skeleton si pàgina nova".
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ADMIN_DIR = path.join(ROOT, 'app', 'admin');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'out', 'build']);

function* walkDirs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    yield full;
    yield* walkDirs(full);
  }
}

if (!fs.existsSync(ADMIN_DIR)) {
  console.log('[missing-loading-tsx] OK: directori app/admin/ no trobat, res a verificar.');
  process.exit(0);
}

const violations = [];
let dirsChecked = 0;

// Comprova el directori arrel d'admin
if (fs.existsSync(path.join(ADMIN_DIR, 'page.tsx'))) {
  dirsChecked++;
  if (!fs.existsSync(path.join(ADMIN_DIR, 'loading.tsx'))) {
    violations.push('app/admin');
  }
}

// Comprova tots els subdirectoris
for (const dir of walkDirs(ADMIN_DIR)) {
  if (!fs.existsSync(path.join(dir, 'page.tsx'))) continue;
  dirsChecked++;
  if (fs.existsSync(path.join(dir, 'loading.tsx'))) continue;
  const rel = path.relative(ROOT, dir).replace(/\\/g, '/');
  violations.push(rel);
}

if (violations.length > 0) {
  console.error(
    `[missing-loading-tsx] FAIL: ${violations.length} pàgina(es) admin sense loading.tsx:`,
  );
  for (const rel of violations) {
    console.error(`  ${rel}/page.tsx — falta loading.tsx al mateix directori`);
  }
  console.error(
    "\nAfegeix un loading.tsx mínim al directori de la pàgina:\n  Nivell 1: export { default } from '../components/AdminLoadingSkeleton';\n  Nivell 2: export { default } from '../../components/AdminLoadingSkeleton';",
  );
  process.exit(1);
}

console.log(
  `[missing-loading-tsx] OK: ${dirsChecked} pàgina(es) admin verificades, totes amb loading.tsx.`,
);
