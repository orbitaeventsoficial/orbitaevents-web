#!/usr/bin/env node
/**
 * qa:customer-inline-href
 * Verifica que cap fitxer de app/ o lib/ (excepte tests i helpers canònics)
 * construeixi literals inline del tipus:
 *   `/admin/clientes/${...}` o '/admin/clientes/' + variable
 *   `/admin/bookings/${...}` o '/admin/bookings/' + variable
 *   `/admin/leads/${...}`   o '/admin/leads/' + variable
 *   `/admin/packs/${...}`   o '/admin/packs/' + variable
 *   `/admin/inventory/${...}` o '/admin/inventory/' + variable
 *   `/admin/email-templates/${...}` o '/admin/email-templates/' + variable
 *   `/admin/presupuestos/${...}` o '/admin/presupuestos/' + variable
 *   `/admin/faq/${...}` o '/admin/faq/' + variable
 *   `/admin/questionnaires/${...}` o '/admin/questionnaires/' + variable
 *   `/admin/blog/edit/${...}`    o '/admin/blog/edit/' + variable
 *
 * Raó: la navegació admin ha de passar pels helpers canònics:
 *   buildCustomerHubHref()    — lib/admin/customerWorkspaceHref.ts
 *   buildBookingHref()        — lib/admin/bookingWorkspaceHref.ts
 *   buildLeadWorkspaceHref()  — lib/admin/leadWorkspaceHref.ts
 *   buildPackHref()           — lib/admin/packWorkspaceHref.ts
 *   buildInventoryHref()      — lib/admin/inventoryWorkspaceHref.ts
 *   buildEmailTemplateHref()  — lib/admin/emailTemplateWorkspaceHref.ts
 *   buildProposalHref()       — lib/admin/proposalWorkspaceHref.ts
 *   buildFaqHref()            — lib/admin/faqWorkspaceHref.ts
 *   buildQuestionnaireHref()  — lib/admin/questionnaireWorkspaceHref.ts
 *   buildBlogEditHref()       — lib/admin/blogWorkspaceHref.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = [path.join(ROOT, 'app'), path.join(ROOT, 'lib')];

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'out', 'build', '__tests__']);
const SKIP_FILES = new Set([
  path.join(ROOT, 'lib', 'admin', 'customerWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'bookingWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'leadWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'packWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'inventoryWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'emailTemplateWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'proposalWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'faqWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'questionnaireWorkspaceHref.ts'),
  path.join(ROOT, 'lib', 'admin', 'blogWorkspaceHref.ts'),
]);

const ADMIN_PATH_PREFIX = /(^|[^A-Za-z0-9_/-])\/admin\//;
const CUSTOMER_TEMPLATE = /(^|[^A-Za-z0-9_/-])\/admin\/clientes\/\$\{/;
const CUSTOMER_CONCAT   = /['"]\/admin\/clientes\/['"]\s*\+/;
const BOOKING_TEMPLATE  = /(^|[^A-Za-z0-9_/-])\/admin\/bookings\/\$\{/;
const BOOKING_CONCAT    = /['"]\/admin\/bookings\/['"]\s*\+/;
const LEAD_TEMPLATE     = /(^|[^A-Za-z0-9_/-])\/admin\/leads\/\$\{/;
const LEAD_CONCAT       = /['"]\/admin\/leads\/['"]\s*\+/;
const PACK_TEMPLATE     = /(^|[^A-Za-z0-9_/-])\/admin\/packs\/\$\{/;
const PACK_CONCAT       = /['"]\/admin\/packs\/['"]\s*\+/;
const INVENTORY_TEMPLATE = /(^|[^A-Za-z0-9_/-])\/admin\/inventory\/\$\{/;
const INVENTORY_CONCAT   = /['"]\/admin\/inventory\/['"]\s*\+/;
const EMAIL_TEMPLATE_TEMPLATE = /(^|[^A-Za-z0-9_/-])\/admin\/email-templates\/\$\{/;
const EMAIL_TEMPLATE_CONCAT   = /['"]\/admin\/email-templates\/['"]\s*\+/;
const PROPOSAL_TEMPLATE = /(^|[^A-Za-z0-9_/-])\/admin\/presupuestos\/\$\{/;
const PROPOSAL_CONCAT   = /['"]\/admin\/presupuestos\/['"]\s*\+/;
const FAQ_TEMPLATE = /(^|[^A-Za-z0-9_/-])\/admin\/faq\/\$\{/;
const FAQ_CONCAT   = /['"]\/admin\/faq\/['"]\s*\+/;
const QUESTIONNAIRE_TEMPLATE = /(^|[^A-Za-z0-9_/-])\/admin\/questionnaires\/\$\{/;
const QUESTIONNAIRE_CONCAT   = /['"]\/admin\/questionnaires\/['"]\s*\+/;
const BLOG_TEMPLATE = /(^|[^A-Za-z0-9_/-])\/admin\/blog\/edit\/\$\{/;
const BLOG_CONCAT   = /['"]\/admin\/blog\/edit\/['"]\s*\+/;

function isTestFile(filePath) {
  return filePath.includes('__tests__') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.tsx') ||
    filePath.endsWith('.spec.ts') ||
    filePath.endsWith('.spec.tsx');
}

function* walkFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      yield full;
    }
  }
}

const violations = [];

for (const dir of SCAN_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walkFiles(dir)) {
    if (isTestFile(file)) continue;
    if (SKIP_FILES.has(file)) continue;

    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//')) continue;
      if (!ADMIN_PATH_PREFIX.test(line)) continue;
      if (
        CUSTOMER_TEMPLATE.test(line) || CUSTOMER_CONCAT.test(line) ||
        BOOKING_TEMPLATE.test(line)  || BOOKING_CONCAT.test(line)  ||
        LEAD_TEMPLATE.test(line)     || LEAD_CONCAT.test(line)     ||
        PACK_TEMPLATE.test(line)     || PACK_CONCAT.test(line)     ||
        INVENTORY_TEMPLATE.test(line) || INVENTORY_CONCAT.test(line) ||
        EMAIL_TEMPLATE_TEMPLATE.test(line) || EMAIL_TEMPLATE_CONCAT.test(line) ||
        PROPOSAL_TEMPLATE.test(line) || PROPOSAL_CONCAT.test(line) ||
        FAQ_TEMPLATE.test(line) || FAQ_CONCAT.test(line) ||
        QUESTIONNAIRE_TEMPLATE.test(line) || QUESTIONNAIRE_CONCAT.test(line) ||
        BLOG_TEMPLATE.test(line) || BLOG_CONCAT.test(line)
      ) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[customer-inline-href] FAIL: ${violations.length} literal(s) inline detectat(s):`,
  );
  for (const v of violations) {
    console.error(`  ${v}`);
  }
  console.error(
    '\nUsa els helpers canònics:' +
    '\n  buildCustomerHubHref(customerId)    — lib/admin/customerWorkspaceHref.ts' +
    '\n  buildBookingHref(bookingId)         — lib/admin/bookingWorkspaceHref.ts' +
    '\n  buildLeadWorkspaceHref(leadId)      — lib/admin/leadWorkspaceHref.ts' +
    '\n  buildPackHref(packId)               — lib/admin/packWorkspaceHref.ts' +
    '\n  buildInventoryHref(itemId)          — lib/admin/inventoryWorkspaceHref.ts' +
    '\n  buildEmailTemplateHref(slug, locale)— lib/admin/emailTemplateWorkspaceHref.ts' +
    '\n  buildProposalHref(proposalId)       — lib/admin/proposalWorkspaceHref.ts' +
    '\n  buildFaqHref(faqId)                 — lib/admin/faqWorkspaceHref.ts' +
    '\n  buildQuestionnaireHref(id)          — lib/admin/questionnaireWorkspaceHref.ts' +
    '\n  buildBlogEditHref(postId)           — lib/admin/blogWorkspaceHref.ts',
  );
  process.exit(1);
}

console.log('[customer-inline-href] OK: cap literal inline de navegació admin canònica detectat.');
