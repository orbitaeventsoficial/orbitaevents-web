#!/usr/bin/env node
/**
 * qa:no-leads-split
 * Detects admin route directories outside app/admin/leads/ whose names suggest
 * a parallel lead management or pipeline workspace — enforces that all lead
 * and commercial pipeline functionality stays in app/admin/leads/.
 * §6.6 PENDENT CRÍTIC: evitar que Leads continuï separat conceptualment
 * del Customer Hub. Qualsevol workspace de leads paral·lel trenca la
 * continuïtat comercial leads → Customer Hub.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');
const LEADS_CANONICAL = path.join(ADMIN_DIR, 'leads');

const LEADS_FRAGMENTS = [
  'pipeline',
  'prospects',
  'prospecting',
  'lead-hub',
  'lead-pipeline',
  'lead-management',
  'lead-funnel',
  'commercial-pipeline',
  'commercial-hub',
  'sales-pipeline',
  'sales-hub',
  'sales-funnel',
  'funnel',
];

function isLeadsSplitName(dirName) {
  const lower = dirName.toLowerCase();
  return LEADS_FRAGMENTS.some(
    (frag) => lower === frag || lower.startsWith(frag + '-') || lower.endsWith('-' + frag),
  );
}

function walkAdminDirs(dir) {
  const violations = [];
  if (!fs.existsSync(dir)) return violations;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (full === LEADS_CANONICAL) continue;
    if (isLeadsSplitName(entry.name)) {
      violations.push(path.relative(repoRoot, full));
    }
    violations.push(...walkAdminDirs(full));
  }
  return violations;
}

const violations = walkAdminDirs(ADMIN_DIR);

if (violations.length === 0) {
  process.stdout.write('[no-leads-split] OK\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-leads-split] FAIL — ${violations.length} leads-split route(s) found outside app/admin/leads/:\n`,
  );
  for (const v of violations) process.stderr.write(`  ${v}\n`);
  process.stderr.write('\nLead and commercial pipeline functionality belongs in app/admin/leads/.\n');
  process.stderr.write('See §6.6 in docs/protocol-producte-admin-ca.md.\n');
  process.exit(1);
}
