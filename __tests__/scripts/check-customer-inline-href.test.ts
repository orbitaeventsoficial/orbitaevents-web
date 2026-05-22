// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-customer-inline-href.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cih-test-'));

  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }

  const result = spawnSync('node', [SCRIPT], {
    cwd: tmpDir,
    encoding: 'utf8',
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-customer-inline-href', () => {
  it('passa quan no hi ha literals inline', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';
import { buildInventoryHref } from '@/lib/admin/inventoryWorkspaceHref';
import { buildEmailTemplateHref } from '@/lib/admin/emailTemplateWorkspaceHref';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import { buildFaqHref } from '@/lib/admin/faqWorkspaceHref';
import { buildQuestionnaireHref } from '@/lib/admin/questionnaireWorkspaceHref';
const href = buildCustomerHubHref(customerId);
const bHref = buildBookingHref(bookingId);
const pHref = buildPackHref(packId);
const iHref = buildInventoryHref(itemId);
const eHref = buildEmailTemplateHref(slug, locale);
const qHref = buildProposalHref(proposalId);
const fHref = buildFaqHref(faqId);
const questionnaireHref = buildQuestionnaireHref(questionnaireId);
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('falla amb template literal /admin/clientes/${...} a app/', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
const href = \`/admin/clientes/\${booking.customerId}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('app/admin/bookings/page.tsx');
  });

  it('falla amb template literal /admin/bookings/${...} a app/', () => {
    const result = runGuard({
      'app/admin/leads/page.tsx': `
const href = \`/admin/bookings/\${booking.id}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('app/admin/leads/page.tsx');
  });

  it('falla amb URL absoluta que incrusta /admin/bookings/${...}', () => {
    const result = runGuard({
      'lib/services/bookingEmail.ts': `
const href = \`\${baseUrl}/admin/bookings/\${booking.id}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('lib/services/bookingEmail.ts');
  });

  it('no confon endpoints API amb navegació admin canònica', () => {
    const result = runGuard({
      'app/admin/bookings/panel.tsx': `
const apiHref = \`/api/admin/bookings/\${bookingId}/status\`;
`,
    });
    expect(result.status).toBe(0);
  });

  it('falla amb literal inline a lib/', () => {
    const result = runGuard({
      'lib/services/someService.ts': `
const href = \`/admin/bookings/\${bookingId}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('lib/services/someService.ts');
  });

  it('falla amb template literal /admin/leads/${...}', () => {
    const result = runGuard({
      'app/admin/presupuestos/panel.tsx': `
const href = \`/admin/leads/\${lead.id}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('app/admin/presupuestos/panel.tsx');
  });

  it('falla amb template literal /admin/packs/${...}', () => {
    const result = runGuard({
      'app/admin/catalog/page.tsx': `
const href = \`/admin/packs/\${pack.id}?tab=content\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('app/admin/catalog/page.tsx');
  });

  it('falla amb template literal /admin/inventory/${...}', () => {
    const result = runGuard({
      'app/admin/inventory/page.tsx': `
const href = \`/admin/inventory/\${item.id}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('app/admin/inventory/page.tsx');
  });

  it('falla amb template literal /admin/email-templates/${...}', () => {
    const result = runGuard({
      'app/admin/email-templates/page.tsx': `
const href = \`/admin/email-templates/\${template.slug}?locale=ca\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('app/admin/email-templates/page.tsx');
  });

  it('falla amb template literal /admin/presupuestos/${...}', () => {
    const result = runGuard({
      'app/admin/quick-create/page.tsx': `
router.push(\`/admin/presupuestos/\${proposal.id}\`);
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('app/admin/quick-create/page.tsx');
  });

  it('falla amb template literal /admin/faq/${...}', () => {
    const result = runGuard({
      'app/admin/faq/page.tsx': `
const href = \`/admin/faq/\${faq.id}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('falla amb template literal /admin/questionnaires/${...}', () => {
    const result = runGuard({
      'app/admin/questionnaires/page.tsx': `
const href = \`/admin/questionnaires/\${template.id}\`;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('falla amb template literal /admin/blog/edit/${...}', () => {
    const result = runGuard({
      'app/admin/blog/page.tsx': `
router.push(\`/admin/blog/edit/\${post.id}\`);
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('falla amb concatenació de string + variable', () => {
    const result = runGuard({
      'app/admin/leads/page.tsx': `
router.push('/admin/clientes/' + customerId);
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('ignora fitxers de test', () => {
    const result = runGuard({
      'app/admin/bookings/__tests__/page.test.tsx': `
const href = \`/admin/clientes/\${id}\`;
`,
      'app/admin/bookings/page.tsx': `
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
`,
    });
    expect(result.status).toBe(0);
  });

  it('ignora comentaris', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
// href={\`/admin/clientes/\${id}\`} - exemple antic
const href = buildCustomerHubHref(id);
`,
    });
    expect(result.status).toBe(0);
  });
});
