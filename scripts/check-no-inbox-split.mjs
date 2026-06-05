#!/usr/bin/env node
/**
 * qa:no-inbox-split
 * Detects admin route directories outside app/admin/inbox/ whose names suggest
 * communications, messaging or inbox functionality — enforces that all internal
 * communication features stay unified in app/admin/inbox/.
 * §6.8 PENDENT CRÍTIC: evitar noves capes paral·leles de comunicacions.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');
const INBOX_CANONICAL = path.join(ADMIN_DIR, 'inbox');

const INBOX_FRAGMENTS = [
  'messages',
  'messaging',
  'chat',
  'comms',
  'communications',
  'communication-hub',
  'inbox-hub',
  'inbox-portal',
  'email-hub',
  'email-center',
  'email-management',
  'contact-center',
  'contact-hub',
  'messaging-portal',
  'message-center',
];

function isInboxSplitName(dirName) {
  const lower = dirName.toLowerCase();
  return INBOX_FRAGMENTS.some(
    (frag) => lower === frag || lower.startsWith(frag + '-') || lower.endsWith('-' + frag),
  );
}

function walkAdminDirs(dir) {
  const violations = [];
  if (!fs.existsSync(dir)) return violations;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (full === INBOX_CANONICAL) continue;
    if (isInboxSplitName(entry.name)) {
      violations.push(path.relative(repoRoot, full));
    }
    violations.push(...walkAdminDirs(full));
  }
  return violations;
}

const violations = walkAdminDirs(ADMIN_DIR);

if (violations.length === 0) {
  process.stdout.write('[no-inbox-split] OK\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-inbox-split] FAIL — ${violations.length} inbox-split route(s) found outside app/admin/inbox/:\n`,
  );
  for (const v of violations) process.stderr.write(`  ${v}\n`);
  process.stderr.write('\nCommunications and messaging functionality belongs in app/admin/inbox/.\n');
  process.stderr.write('See §6.8 in docs/admin-protocol.md.\n');
  process.exit(1);
}
