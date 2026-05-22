// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-schema-drift.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-schema-drift-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

const SCHEMA_OK = `
model Setting {
  id  String @id
  key String

  @@map("settings")
}

model Lead {
  id   String @id
  name String

  @@map("leads")
}
`;

const SCHEMA_MISSING_MAP = `
model Setting {
  id  String @id
  key String

  @@map("settings")
}

model Lead {
  id   String @id
  name String
}
`;

const SCHEMA_DUPLICATE_MAP = `
model Setting {
  id  String @id

  @@map("items")
}

model Lead {
  id  String @id

  @@map("items")
}
`;

const SQL_ADD_KNOWN = `ALTER TABLE "settings" ADD COLUMN "value" TEXT NOT NULL DEFAULT '';`;
const SQL_ADD_ORPHAN = `ALTER TABLE "old_leads" ADD COLUMN "score" INT;`;

describe('check-schema-drift', () => {
  it('passa sense schema.prisma', () => {
    const result = runGuard({});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[schema-drift] SKIP');
  });

  it('passa quan tots els models tenen @@map i no hi ha orfes', () => {
    const result = runGuard({
      'prisma/schema.prisma': SCHEMA_OK,
      'prisma/migrations/20240101_init/migration.sql': SQL_ADD_KNOWN,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[schema-drift] OK');
    expect(result.stdout).toContain('2 models verificats');
  });

  it('falla quan un model no té @@map', () => {
    const result = runGuard({
      'prisma/schema.prisma': SCHEMA_MISSING_MAP,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[schema-drift] FAIL');
    expect(result.stderr).toContain('"Lead"');
    expect(result.stderr).toContain('@@map');
  });

  it('falla quan dos models comparteixen el mateix @@map', () => {
    const result = runGuard({
      'prisma/schema.prisma': SCHEMA_DUPLICATE_MAP,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[schema-drift] FAIL');
    expect(result.stderr).toContain('"items"');
    expect(result.stderr).toContain('duplicat');
  });

  it('falla quan una migració fa ADD COLUMN sobre una taula no present al schema', () => {
    const result = runGuard({
      'prisma/schema.prisma': SCHEMA_OK,
      'prisma/migrations/20240101_init/migration.sql': SQL_ADD_ORPHAN,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[schema-drift] FAIL');
    expect(result.stderr).toContain('"old_leads"');
    expect(result.stderr).toContain('orfena');
  });

  it('passa sense migracions', () => {
    const result = runGuard({
      'prisma/schema.prisma': SCHEMA_OK,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[schema-drift] OK');
  });

  it('reporta múltiples errors en un sol run', () => {
    const result = runGuard({
      'prisma/schema.prisma': SCHEMA_MISSING_MAP,
      'prisma/migrations/20240101_init/migration.sql': SQL_ADD_ORPHAN,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('"Lead"');
    expect(result.stderr).toContain('"old_leads"');
  });
});
