import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { loadRepoElectricAtlas } from '@/lib/services/repoElectricAtlasService';

let tmpRoot: string | null = null;

async function writeFixture(relativePath: string, content: string) {
  if (!tmpRoot) tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'orbita-atlas-'));
  const fullPath = path.join(tmpRoot, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
}

afterEach(async () => {
  if (!tmpRoot) return;
  await fs.rm(tmpRoot, { recursive: true, force: true });
  tmpRoot = null;
});

describe('repoElectricAtlasService', () => {
  it('censa fitxers, símbols, imports, fetch, rutes i models Prisma', async () => {
    await writeFixture('lib/services/demoService.ts', [
      "import 'server-only';",
      "import { helper } from '@/lib/helper';",
      'export function runDemo() { return helper(); }',
      'const localWire = () => fetch("/api/admin/demo");',
    ].join('\n'));
    await writeFixture('lib/helper.ts', [
      'export function helper() {',
      '  return true;',
      '}',
    ].join('\n'));
    await writeFixture('app/api/admin/demo/route.ts', [
      'export async function GET() {',
      '  return Response.json({ ok: true });',
      '}',
    ].join('\n'));
    await writeFixture('app/admin/demo/page.tsx', [
      'export default function DemoPage() {',
      '  return null;',
      '}',
    ].join('\n'));
    await writeFixture('prisma/schema.prisma', [
      'model Lead {',
      '  id String @id',
      '}',
      'enum LeadStatus {',
      '  NEW',
      '}',
    ].join('\n'));

    const atlas = await loadRepoElectricAtlas(tmpRoot!);

    expect(atlas.summary.files).toBe(5);
    expect(atlas.summary.services).toBe(1);
    expect(atlas.summary.routes).toBe(1);
    expect(atlas.summary.models).toBe(1);
    expect(atlas.summary.enums).toBe(1);
    expect(atlas.functions.some((fn) => fn.name === 'runDemo' && fn.exported)).toBe(true);
    expect(atlas.functions.some((fn) => fn.name === 'DemoPage' && fn.file === 'app/admin/demo/page.tsx')).toBe(true);
    expect(atlas.cables.some((cable) => cable.to === '@/lib/helper' && cable.kind === 'import')).toBe(true);
    expect(atlas.cables.some((cable) => cable.to === '/api/admin/demo' && cable.kind === 'fetch')).toBe(true);
    expect(atlas.internalCables.some((cable) => cable.from === 'lib/services/demoService.ts' && cable.to === 'lib/helper.ts')).toBe(true);
  });

  it('construeix fluxos, punts d intervencio i glossari sobre fitxers reals', async () => {
    await writeFixture('app/admin/dossiers/page.tsx', [
      "import { createDossier } from '@/lib/services/dossierService';",
      'export default function DossiersPage() {',
      '  createDossier();',
      '  return null;',
      '}',
    ].join('\n'));
    await writeFixture('app/admin/dossiers/DossierGeneratorClient.tsx', [
      "import { mapLeadServiceLinesToDossierProducts } from '@/lib/services/dossierProductMappingService';",
      'export const DossierGeneratorClient = () => null;',
      'mapLeadServiceLinesToDossierProducts([]);',
    ].join('\n'));
    await writeFixture('app/api/admin/dossiers/[id]/composite/route.ts', [
      "import { generateDossierCompositePDF } from '@/lib/services/dossierCompositePdfService';",
      'export async function GET() {',
      '  await generateDossierCompositePDF();',
      '  return Response.json({ ok: true });',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/dossierService.ts', [
      "import { enforceDossierMargin } from './dossierMarginGuardService';",
      'export function createDossier() {',
      '  return enforceDossierMargin();',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/dossierMarginGuardService.ts', [
      "import { computeBookingFinancialSummary } from '@/lib/services/costEngine';",
      'export function enforceDossierMargin() {',
      '  return computeBookingFinancialSummary();',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/costEngine.ts', [
      'export function computeBookingFinancialSummary() {',
      '  return 1;',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/dossierProductMappingService.ts', [
      'export function mapLeadServiceLinesToDossierProducts(lines: unknown[]) {',
      '  return lines;',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/dossierSnapshotService.ts', [
      'export function buildLineSnapshot(productIds: string[]) {',
      '  return { productIds, lineSnapshot: true };',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/dossierCompositePdfService.ts', [
      'export async function generateDossierCompositePDF() {',
      '  return new Uint8Array();',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/automationTriggers.ts', [
      "import { sendLeadWelcomeEmail } from '@/lib/services/leadWelcomeEmailService';",
      'export async function onLeadCreated(leadId: string) {',
      "  return sendLeadWelcomeEmail({ to: 'lead@example.com', clientName: leadId });",
      '}',
    ].join('\n'));
    await writeFixture('lib/services/leadWelcomeEmailService.ts', [
      "import { getTemplate } from '@/lib/services/emailTemplateService';",
      'export async function sendLeadWelcomeEmail() {',
      "  return getTemplate('welcome', 'ca', {});",
      '}',
    ].join('\n'));
    await writeFixture('lib/services/postEventPlaybookService.ts', [
      'export function loadPostEventPlaybook() {',
      '  return [];',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/postEventPendingService.ts', [
      'export function buildPendingPostEventFeedbackBookingWhere() {',
      '  return { postEventEmailSent: true };',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/postEventDispatchService.ts', [
      'export async function sendPostEventEmailForBooking() {',
      '  return { postEventEmailSent: true };',
      '}',
    ].join('\n'));
    await writeFixture('lib/services/emailTemplateService.ts', [
      'export async function getTemplate() {',
      "  return { subject: 'Hola', bodyHtml: '<p>Hola</p>' };",
      '}',
    ].join('\n'));
    await writeFixture('lib/utils/dossier-html-builder.ts', [
      'export function buildDossierHtml() {',
      "  return '<html></html>';",
      '}',
    ].join('\n'));
    await writeFixture('prisma/schema.prisma', [
      'model Lead {',
      '  id String @id',
      '}',
      'model Booking {',
      '  id String @id',
      '}',
      'model Dossier {',
      '  id String @id',
      '}',
    ].join('\n'));

    const atlas = await loadRepoElectricAtlas(tmpRoot!);
    const dossierFlow = atlas.flows.find((flow) => flow.id === 'dossier-pdf');
    const marginTouchpoint = atlas.touchpoints.find((touchpoint) => touchpoint.id === 'change-margin');
    const leadAutopilotTouchpoint = atlas.touchpoints.find((touchpoint) => touchpoint.id === 'change-lead-autopilot');
    const dossierEntry = atlas.dictionary.find((entry) => entry.id === 'dossier');
    const postEventEntry = atlas.dictionary.find((entry) => entry.id === 'post-event');

    expect(atlas.synthesis.verdict).toContain('CRM/ERP');
    expect(dossierFlow?.filesCount).toBeGreaterThanOrEqual(6);
    expect(dossierFlow?.missingStages).toBe(0);
    expect(marginTouchpoint?.files.some((file) => file.path === 'lib/services/costEngine.ts')).toBe(true);
    expect(leadAutopilotTouchpoint?.files.some((file) => file.path === 'lib/services/leadWelcomeEmailService.ts')).toBe(true);
    expect(leadAutopilotTouchpoint?.internalCables.some((cable) => cable.from === 'lib/services/automationTriggers.ts' && cable.to === 'lib/services/leadWelcomeEmailService.ts')).toBe(true);
    expect(dossierEntry?.files.some((file) => file.path === 'lib/services/dossierService.ts')).toBe(true);
    expect(postEventEntry?.sourceOfTruth).toEqual(expect.arrayContaining(['postEventPlaybookService', 'postEventPendingService', 'postEventDispatchService', 'Booking.postEventEmailSent']));
    expect(postEventEntry?.sourceOfTruth).not.toContain('ClientFeedback');
    expect(postEventEntry?.files.map((file) => file.path)).toEqual(expect.arrayContaining([
      'lib/services/postEventDispatchService.ts',
      'lib/services/postEventPendingService.ts',
      'lib/services/postEventPlaybookService.ts',
    ]));
    expect(atlas.internalCables.some((cable) => cable.from === 'app/admin/dossiers/page.tsx' && cable.to === 'lib/services/dossierService.ts')).toBe(true);
    expect(atlas.models.some((model) => model.name === 'Lead' && model.kind === 'model')).toBe(true);
  });

  it('no exposa fitxers sensibles ni carpetes generades', async () => {
    await writeFixture('.env.local', 'DATABASE_URL="secret"');
    await writeFixture('.next-dev.out.log', 'temporary dev output');
    await writeFixture('node_modules/pkg/index.js', 'export const ignored = true;');
    await writeFixture('docs/readme.md', '# Visible');

    const atlas = await loadRepoElectricAtlas(tmpRoot!);

    expect(atlas.files.map((file) => file.path)).toEqual(['docs/readme.md']);
  });
});
