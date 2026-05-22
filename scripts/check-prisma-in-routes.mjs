#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const API_DIR = path.join(repoRoot, 'app', 'api');

// Routes that legitimately need direct prisma access for low-level system operations
const ALLOWLIST = new Set([
  'app/api/admin/system/db-reconnect/route.ts',
]);

const SKIP_SEGMENTS = new Set(['node_modules', '.next', '__tests__', 'dist', 'build', '.git']);

function* walkRoutes(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkRoutes(full);
    } else if (entry.isFile() && entry.name === 'route.ts') {
      yield full;
    }
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

const violations = [];

for (const filePath of walkRoutes(API_DIR)) {
  const relative = toPosix(path.relative(repoRoot, filePath));
  if (ALLOWLIST.has(relative)) continue;

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const hasPrismaImport =
    /from ['"]@\/lib\/prisma['"]/.test(content) ||
    /import\(['"]@\/lib\/prisma['"]\)/.test(content);

  if (hasPrismaImport) {
    violations.push(relative);
  }
}

if (violations.length > 0) {
  console.error(
    `[prisma-in-routes] FAIL: ${violations.length} ruta(es) API amb prisma directe (ha d'anar via servei):`,
  );
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error(
    "Rutes API no poden importar '@/lib/prisma' directament — usar serveis de lib/services/. Excepció justificada: system/db-reconnect (operació de sistema de baix nivell).",
  );
  process.exit(1);
}

const total = [...walkRoutes(API_DIR)].length;
console.log(
  `[prisma-in-routes] OK: ${total} rutes API verificades — cap importa prisma directament (${ALLOWLIST.size} allowlistades).`,
);
