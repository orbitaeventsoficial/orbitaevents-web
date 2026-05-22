#!/usr/bin/env node
/**
 * qa:no-social-split
 * Detects admin route directories outside app/admin/social/ whose names suggest
 * social, editorial or content-calendar functionality — enforces that social
 * features stay unified in app/admin/social/.
 * §6.8 PENDENT CRÍTIC: evitar que futures peces de Social tornin a separar
 * idees, calendari i captació.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');
const SOCIAL_CANONICAL = path.join(ADMIN_DIR, 'social');

const SOCIAL_FRAGMENTS = [
  'social-calendar',
  'social-ideas',
  'social-posts',
  'social-hub',
  'social-media',
  'social-management',
  'editorial-calendar',
  'editorial',
  'content-calendar',
  'content-scheduling',
  'content-planning',
  'post-scheduler',
  'post-planner',
];

function isSocialSplitName(dirName) {
  const lower = dirName.toLowerCase();
  return SOCIAL_FRAGMENTS.some(
    (frag) => lower === frag || lower.startsWith(frag + '-') || lower.endsWith('-' + frag),
  );
}

function walkAdminDirs(dir) {
  const violations = [];
  if (!fs.existsSync(dir)) return violations;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (full === SOCIAL_CANONICAL) continue;
    if (isSocialSplitName(entry.name)) {
      violations.push(path.relative(repoRoot, full));
    }
    violations.push(...walkAdminDirs(full));
  }
  return violations;
}

const violations = walkAdminDirs(ADMIN_DIR);

if (violations.length === 0) {
  process.stdout.write('[no-social-split] OK\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-social-split] FAIL — ${violations.length} social-split route(s) found outside app/admin/social/:\n`,
  );
  for (const v of violations) process.stderr.write(`  ${v}\n`);
  process.stderr.write('\nSocial, editorial and content-calendar functionality belongs in app/admin/social/.\n');
  process.stderr.write('See §6.8 in docs/protocol-producte-admin-ca.md.\n');
  process.exit(1);
}
