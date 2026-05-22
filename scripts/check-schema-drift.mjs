#!/usr/bin/env node
/**
 * check-schema-drift.mjs
 *
 * Verifica convencions del schema.prisma que prevenen derive silenciós:
 * 1. Tot model té @@map → evita noms de taula PascalCase a la BD
 * 2. No hi ha noms de taula duplicats entre models
 * 3. Les ALTER TABLE ADD COLUMN de les migracions apunten a taules del schema
 *    (detecta migracions orfes quan una taula s'ha renombrat o eliminat)
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const SCHEMA_PATH = path.join(repoRoot, 'prisma', 'schema.prisma');
const MIGRATIONS_DIR = path.join(repoRoot, 'prisma', 'migrations');

function parseModels(content) {
  const models = [];
  const lines = content.split('\n');
  let inModel = false;
  let depth = 0;
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inModel) {
      const m = trimmed.match(/^model\s+(\w+)\s*\{/);
      if (m) {
        inModel = true;
        depth = 1;
        current = { name: m[1], tableName: null, bodyLines: [] };
      }
      continue;
    }

    if (!trimmed.startsWith('//')) {
      for (const ch of trimmed) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
      }
    }

    if (depth === 0) {
      inModel = false;
      const bodyText = current.bodyLines.join('\n');
      const mapMatch = bodyText.match(/@@map\("([^"]+)"\)/);
      current.tableName = mapMatch ? mapMatch[1] : null;
      models.push(current);
      current = null;
      continue;
    }

    current.bodyLines.push(trimmed);
  }

  return models;
}

function collectAlterAddColumns() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  const results = [];
  for (const entry of fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sqlPath = path.join(MIGRATIONS_DIR, entry.name, 'migration.sql');
    if (!fs.existsSync(sqlPath)) continue;
    const sql = fs.readFileSync(sqlPath, 'utf8');
    // Trobar ALTER TABLE "tableName" ... ADD COLUMN
    for (const stmt of sql.split(';')) {
      if (!stmt.includes('ADD COLUMN')) continue;
      const tableMatch = stmt.match(/ALTER TABLE\s+"([^"]+)"/i);
      if (tableMatch) results.push({ table: tableMatch[1], migration: entry.name });
    }
  }
  return results;
}

function main() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.log('[schema-drift] SKIP: prisma/schema.prisma no trobat.');
    process.exit(0);
  }

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const models = parseModels(schema);
  const errors = [];

  // 1. Tot model ha de tenir @@map
  const withoutMap = models.filter((m) => m.tableName === null);
  for (const m of withoutMap) {
    errors.push(
      `Model "${m.name}" no té @@map — el nom de taula a la BD seria "${m.name}" (PascalCase). Afegeix @@map("nom_taula").`,
    );
  }

  // 2. No hi ha noms de taula duplicats
  const tableNames = models.filter((m) => m.tableName).map((m) => m.tableName);
  const seen = new Set();
  for (const t of tableNames) {
    if (seen.has(t)) {
      errors.push(`Nom de taula "${t}" duplicat — dos models apunten a la mateixa taula.`);
    }
    seen.add(t);
  }

  // 3. Les ALTER TABLE ADD COLUMN de les migracions apunten a taules del schema
  const knownTables = new Set(tableNames);
  if (knownTables.size > 0) {
    const alters = collectAlterAddColumns();
    for (const { table, migration } of alters) {
      if (!knownTables.has(table)) {
        errors.push(
          `Migració "${migration}" fa ADD COLUMN a taula "${table}" que ja no existeix al schema — migració orfena o taula renombrada sense actualitzar.`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error(
      `[schema-drift] FAIL: ${errors.length} problema(es) detectat(s) al schema:`,
    );
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log(
    `[schema-drift] OK: ${models.length} models verificats — convencions de schema correctes.`,
  );
}

main();
