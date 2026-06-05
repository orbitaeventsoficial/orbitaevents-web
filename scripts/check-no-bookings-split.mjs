#!/usr/bin/env node
/**
 * qa:no-bookings-split
 * Detects admin route directories outside app/admin/bookings/ whose names
 * suggest a parallel reservations or events management workspace — enforces
 * that all booking and operational event functionality stays in
 * app/admin/bookings/.
 * §6.7 coherència: evitar que reserves es fragmentin en workspaces paral·lels.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');
const BOOKINGS_CANONICAL = path.join(ADMIN_DIR, 'bookings');

const BOOKINGS_FRAGMENTS = [
  'reservations',
  'reservas',
  'booking-hub',
  'bookings-hub',
  'events-management',
  'event-management',
  'operations-hub',
  'booking-management',
  'booking-pipeline',
  'event-pipeline',
  'events-hub',
];

function isBookingsSplitName(dirName) {
  const lower = dirName.toLowerCase();
  return BOOKINGS_FRAGMENTS.some(
    (frag) => lower === frag || lower.startsWith(frag + '-') || lower.endsWith('-' + frag),
  );
}

function walkAdminDirs(dir) {
  const violations = [];
  if (!fs.existsSync(dir)) return violations;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (full === BOOKINGS_CANONICAL) continue;
    if (isBookingsSplitName(entry.name)) {
      violations.push(path.relative(repoRoot, full));
    }
    violations.push(...walkAdminDirs(full));
  }
  return violations;
}

const violations = walkAdminDirs(ADMIN_DIR);

if (violations.length === 0) {
  process.stdout.write('[no-bookings-split] OK\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-bookings-split] FAIL — ${violations.length} bookings-split route(s) found outside app/admin/bookings/:\n`,
  );
  for (const v of violations) process.stderr.write(`  ${v}\n`);
  process.stderr.write('\nBooking and event management functionality belongs in app/admin/bookings/.\n');
  process.stderr.write('See §6.7 in docs/admin-protocol.md.\n');
  process.exit(1);
}
