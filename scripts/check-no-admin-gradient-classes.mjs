#!/usr/bin/env node
/**
 * qa:no-admin-gradient-classes
 * Detects Tailwind gradient utility classes (bg-gradient-to-*) in admin .tsx
 * files. Admin gradients must use .admin-gradient--* CSS classes defined in
 * admin-theme.css, not inline Tailwind gradient combinations.
 * CLAUDE.md: "Gradients: MAI Tailwind gradient classes directes. Usar .admin-gradient--*"
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walkFiles(ADMIN_DIR)) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('bg-gradient-to-')) {
      violations.push(`  ${path.relative(repoRoot, file).split(path.sep).join('/')}:${i + 1}`);
    }
  }
}

if (violations.length === 0) {
  process.stdout.write('[no-admin-gradient-classes] OK\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-admin-gradient-classes] FAIL — ${violations.length} Tailwind gradient class(es) in app/admin/:\n`,
  );
  for (const v of violations) process.stderr.write(v + '\n');
  process.stderr.write(
    '\nUse .admin-gradient--* CSS classes from admin-theme.css instead of bg-gradient-to-* utilities.\n',
  );
  process.exit(1);
}
