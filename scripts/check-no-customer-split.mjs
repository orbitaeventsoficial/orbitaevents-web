#!/usr/bin/env node
/**
 * qa:no-customer-split
 * Detects admin route directories outside app/admin/clientes/ whose names suggest
 * parallel customer management functionality — enforces that customer hub,
 * history, analytics and CRM stays unified in app/admin/clientes/.
 * §6.5 PENDENT CRÍTIC: Customer Hub ha d'absorbir fluxos comercials; cada nou
 * flux de client ha de tenir lectura o entrada canònica des del hub.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');
const CUSTOMER_CANONICAL = path.join(ADMIN_DIR, 'clientes');

const CUSTOMER_FRAGMENTS = [
  'customers',
  'customer-hub',
  'customer-dashboard',
  'customer-analytics',
  'customer-reports',
  'customer-history',
  'customer-portal',
  'customer-view',
  'customer-profile',
  'customer-management',
  'client-hub',
  'client-dashboard',
  'client-analytics',
  'client-reports',
  'client-portal',
  'client-management',
  'client-history',
  'crm',
  'contact-management',
];

function isCustomerSplitName(dirName) {
  const lower = dirName.toLowerCase();
  return CUSTOMER_FRAGMENTS.some(
    (frag) => lower === frag || lower.startsWith(frag + '-') || lower.endsWith('-' + frag),
  );
}

function walkAdminDirs(dir) {
  const violations = [];
  if (!fs.existsSync(dir)) return violations;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (full === CUSTOMER_CANONICAL) continue;
    if (isCustomerSplitName(entry.name)) {
      violations.push(path.relative(repoRoot, full));
    }
    violations.push(...walkAdminDirs(full));
  }
  return violations;
}

const violations = walkAdminDirs(ADMIN_DIR);

if (violations.length === 0) {
  process.stdout.write('[no-customer-split] OK\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-customer-split] FAIL — ${violations.length} customer-split route(s) found outside app/admin/clientes/:\n`,
  );
  for (const v of violations) process.stderr.write(`  ${v}\n`);
  process.stderr.write('\nCustomer hub, analytics and CRM functionality belongs in app/admin/clientes/.\n');
  process.stderr.write('See §6.5 in docs/protocol-producte-admin-ca.md.\n');
  process.exit(1);
}
