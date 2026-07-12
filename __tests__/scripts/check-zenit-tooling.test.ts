// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-zenit-tooling.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-zenit-tooling-'));
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

function packageJson(validateCore = 'pnpm run qa:protocol && pnpm run qa:zenit-tooling') {
  return JSON.stringify(
    {
      scripts: {
        'zenit:db:audit': 'node scripts/zenit-db-audit.mjs',
        'zenit:clean:legacy-quotes': 'node scripts/zenit-clean-legacy-quotes.mjs',
        'zenit:clean:e2e-fixtures': 'node scripts/zenit-clean-e2e-fixtures.mjs',
        'qa:zenit-tooling': 'node scripts/check-zenit-tooling.mjs',
        'validate:core': validateCore,
      },
    },
    null,
    2,
  );
}

const validAudit = `
const LEGACY_QUOTE_PREFIX = 'quote-email:';
const PROPOSAL_EMAIL_TEMPLATE_KEY = 'proposal-send';
const QUOTE_SNAPSHOT_SAFETY = 'QUOTE_SNAPSHOT_V1';
const ADMIN_TEST_ARTIFACT_CONFIG_PATH = 'lib/constants/adminTestArtifacts.json';
const POST_EVENT_WORKFLOW_CONFIG_PATH = 'lib/constants/postEventWorkflow.json';
const ACCEPTED_PROPOSAL_STATUS = 'ACCEPTED';
console.log('No escriu res. No elimina res.');
console.log('Proposal SENT/VIEWED amb PDF però sense quoteSnapshot canònic');
console.log('EmailSend de pressupost sense traça orbitaKind=proposal');
console.log('EmailSend de pressupost amb link/PDF divergent del Proposal');
console.log('Proposal ACCEPTED sense bookingId');
console.log('Contracte SENT/SIGNED sense contractPdfUrl/contractPdfKey');
console.log('Factura activa sense pdfUrl/pdfKey');
console.log('Albara DELIVERED/SIGNED sense pdfUrl/pdfKey');
console.log('Booking COMPLETED post-event sense arrencar');
console.log('postEventEmailSent=true sense postEventEmailSentAt');
console.log('Artefactes de prova Zenit');
console.log('Handoff a Claude');
await prisma.leadDocument.findMany();
await prisma.customer.findMany();
await prisma.lead.findMany();
await prisma.dossier.findMany();
await prisma.proposal.findMany();
await prisma.booking.findMany();
await prisma.invoice.findMany();
await prisma.deliveryNote.findMany();
await prisma.emailSend.findMany();
await prisma.leadNote.findMany();
await prisma.leadActivity.findMany();
await prisma.customQuote.findMany();
const sentLikeProposalsIncompleteDispatch = [];
const sentLikeProposalsMissingQuoteSnapshot = [];
const proposalEmailTraceMismatches = [];
const proposalEmailDocumentMismatches = [];
const acceptedProposalsWithoutBooking = [];
const advancedContractsMissingArtifact = [];
const activeInvoicesMissingPdf = [];
const advancedDeliveryNotesMissingPdf = [];
const completedBookingsPostEventNotStarted = [];
const postEventEmailFlagWithoutSentAt = [];
const adminTestArtifactCustomers = [];
const adminTestArtifactLeads = [];
const adminTestArtifactBookings = [];
const adminTestArtifactDossiers = [];
const adminTestArtifactProposals = [];
const adminTestArtifactEmailSends = [];
const adminTestArtifactLeadDocuments = [];
const adminTestArtifactLeadNotes = [];
const adminTestArtifactLeadActivities = [];
const acceptedProposalStatusesAudited = [];
const activeInvoiceStatusesAudited = [];
const advancedDeliveryNoteStatusesAudited = [];
const postEventAuditWindowDays = 90;
const postEventWorkflowConfigPath = POST_EVENT_WORKFLOW_CONFIG_PATH;
const postEventEmailDueDays = 2;
const adminTestArtifactTextMarkersAudited = [];
const adminTestArtifactPrefixMarkersAudited = [];
const proposalEmailTemplateKeyAudited = PROPOSAL_EMAIL_TEMPLATE_KEY;
const proposalEmailOrbitaKindAudited = 'proposal';
const proposalQuoteSnapshotSafetyAudited = QUOTE_SNAPSHOT_SAFETY;
const proposalEmailDocumentLinkAudited = 'EmailSend.htmlBody -> Proposal.pdfUrl';
void sentLikeProposalsIncompleteDispatch;
void sentLikeProposalsMissingQuoteSnapshot;
void proposalEmailTraceMismatches;
void proposalEmailDocumentMismatches;
void acceptedProposalsWithoutBooking;
void advancedContractsMissingArtifact;
void activeInvoicesMissingPdf;
void advancedDeliveryNotesMissingPdf;
void completedBookingsPostEventNotStarted;
void postEventEmailFlagWithoutSentAt;
void adminTestArtifactCustomers;
void adminTestArtifactLeads;
void adminTestArtifactBookings;
void adminTestArtifactDossiers;
void adminTestArtifactProposals;
void adminTestArtifactEmailSends;
void adminTestArtifactLeadDocuments;
void adminTestArtifactLeadNotes;
void adminTestArtifactLeadActivities;
void acceptedProposalStatusesAudited;
void activeInvoiceStatusesAudited;
void advancedDeliveryNoteStatusesAudited;
void postEventAuditWindowDays;
void postEventWorkflowConfigPath;
void postEventEmailDueDays;
void adminTestArtifactTextMarkersAudited;
void adminTestArtifactPrefixMarkersAudited;
void proposalEmailTemplateKeyAudited;
void proposalEmailOrbitaKindAudited;
void proposalQuoteSnapshotSafetyAudited;
void proposalEmailDocumentLinkAudited;
`;

const validAdminTestArtifactsConfig = JSON.stringify({
  textMarkers: ['@example.test', 'zenit e2e', 'zenit.e2e'],
  prefixMarkers: ['zenit whatsapp', 'zenit mail', 'zenit config', 'zenit admin'],
});

const validPostEventWorkflowConfig = JSON.stringify({
  emailDueDays: 2,
  startDueDays: 3,
  catchupWindowDays: 90,
  pendingTake: 50,
  automationTake: 20,
  playbookTake: 100,
  actionDueDays: {
    thank_you: 3,
    testimonial: 7,
    social_post: 14,
    referral_ask: 30,
  },
});

const validPostEventPlaybookService = `
import {
  POST_EVENT_DAY_MS,
  POST_EVENT_WORKFLOW,
  getPostEventWorkflowDates,
} from '@/lib/constants/postEventWorkflow';
const ACTION_DUE_DAYS = POST_EVENT_WORKFLOW.actionDueDays;
export async function loadPostEventPlaybook(now = new Date()) {
  const { catchupFrom } = getPostEventWorkflowDates(now);
  await prisma.booking.findMany({
    where: { status: 'COMPLETED', eventDate: { gte: catchupFrom, lte: now } },
    take: POST_EVENT_WORKFLOW.playbookTake,
  });
  return POST_EVENT_DAY_MS + ACTION_DUE_DAYS.thank_you;
}
`;

const validPostEventPendingService = `
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { getPostEventWorkflowDates } from '@/lib/constants/postEventWorkflow';
export function buildPendingPostEventEmailBookingWhere(now = new Date()) {
  const { catchupFrom, emailDueBefore } = getPostEventWorkflowDates(now);
  return { status: 'COMPLETED', eventDate: { gte: catchupFrom, lte: emailDueBefore }, postEventEmailSent: false, clientEmail: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } } };
}
export function buildPendingPostEventFeedbackBookingWhere(now = new Date()) {
  return buildPendingPostEventEmailBookingWhere(now);
}
export function buildPendingPostEventReportBookingWhere(now = new Date()) {
  const { catchupFrom, startDueBefore } = getPostEventWorkflowDates(now);
  return { status: 'COMPLETED', eventDate: { gte: catchupFrom, lte: startDueBefore }, postEventReport: null };
}
export function buildPendingPostEventSurveyBookingWhere(now = new Date()) {
  const { catchupFrom, startDueBefore } = getPostEventWorkflowDates(now);
  return { status: 'COMPLETED', eventDate: { gte: catchupFrom, lte: startDueBefore }, clientSurvey: null };
}
export function buildNotStartedPostEventBookingWhere(now = new Date()) {
  const { catchupFrom, startDueBefore } = getPostEventWorkflowDates(now);
  return { status: 'COMPLETED', eventDate: { gte: catchupFrom, lte: startDueBefore }, postEventEmailSent: false, postEventReport: null, clientSurvey: null };
}
`;

const validPostEventHubPage = `
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import { buildPendingPostEventReportBookingWhere, buildPendingPostEventSurveyBookingWhere } from '@/lib/services/postEventPendingService';
export async function getPostEventData() {
  await prisma.booking.findMany({ where: buildPendingPostEventReportBookingWhere(), take: POST_EVENT_WORKFLOW.pendingTake });
  await prisma.booking.findMany({ where: buildPendingPostEventSurveyBookingWhere(), take: POST_EVENT_WORKFLOW.pendingTake });
}
`;

const validPostEventReportsPage = `
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import { buildPendingPostEventReportBookingWhere } from '@/lib/services/postEventPendingService';
export async function getAvailableBookings() {
  return prisma.booking.findMany({ where: buildPendingPostEventReportBookingWhere(), take: POST_EVENT_WORKFLOW.pendingTake });
}
`;

const validPostEventFeedbackPage = `
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import { buildPendingPostEventFeedbackBookingWhere } from '@/lib/services/postEventPendingService';
export async function getCompletedBookings() {
  return prisma.booking.findMany({ where: buildPendingPostEventFeedbackBookingWhere(), take: POST_EVENT_WORKFLOW.pendingTake });
}
`;

const validPostEventPlaybookPage = `
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
export default function PlaybookPage() {
  return <p>Les reserves completades dels darrers {POST_EVENT_WORKFLOW.catchupWindowDays} dies apareixen aqui.</p>;
}
`;

const validCleaner = `
const LEGACY_QUOTE_PREFIX = 'quote-email:';
const apply = args.has('--apply');
const where = {
  fileUrl: { startsWith: LEGACY_QUOTE_PREFIX },
  filePath: null,
};
if (!apply) {
  console.log('DRY-RUN');
}
await prisma.leadDocument.deleteMany({ where });
`;

const validE2eCleaner = `
const ADMIN_TEST_ARTIFACT_CONFIG_PATH = path.join(process.cwd(), 'lib', 'constants', 'adminTestArtifacts.json');
function adminTestArtifactWhere(fields) {
  return { OR: fields };
}
const apply = args.has('--apply');
if (!apply) {
  console.log('DRY-RUN');
}
await prisma.$transaction(async (tx) => {
  await tx.lead.deleteMany({ where: adminTestArtifactWhere(['name']) });
});
`;

const validAdminQuoteEmailService = `
export async function sendAdminQuoteEmail() {
  return {
    status: 410,
    body: {
      error: 'Flux antic de pressupost desactivat',
      canonicalRoute: '/api/admin/proposals/:id/send',
    },
  };
}
`;

const validCustomQuoteAdminService = `
export const CUSTOM_QUOTE_RETIRED_ERROR = 'retirat';
export async function listAdminCustomQuotes() {
  return prisma.customQuote.findMany();
}
export async function getAdminCustomQuote() {
  return prisma.customQuote.findUnique();
}
export async function createAdminCustomQuote() {
  return { status: 410, body: { canonicalRoute: '/admin/presupuestos' } };
}
export async function updateAdminCustomQuote() {
  return { status: 410, body: { canonicalRoute: '/admin/presupuestos' } };
}
export async function deleteAdminCustomQuote() {
  return { status: 410, body: { canonicalRoute: '/admin/presupuestos' } };
}
`;

const validLeadQuoteRouteHandler = `
export function buildLegacyQuoteDisabledResponse() {
  return Response.json({
    error: 'Flux antic de pressupost desactivat',
    canonicalRoute: '/admin/presupuestos',
  }, { status: 410 });
}
export async function handleLeadQuoteGet() {
  return buildLegacyQuoteDisabledResponse();
}
export async function handleLeadQuotePost() {
  return buildLegacyQuoteDisabledResponse();
}
`;

const validLeadDocumentService = `
export async function uploadLeadDocument() {
  const rawType = 'FILE';
  if (rawType === 'QUOTE') {
    return {
      status: 410,
      body: {
        error: 'Els pressupostos LeadDocument estan desactivats',
        canonicalRoute: '/admin/presupuestos',
      },
    };
  }
  return { status: 200, body: {} };
}
`;

function validFiles(overrides: Record<string, string> = {}) {
  return {
    'package.json': packageJson(),
    'scripts/zenit-db-audit.mjs': validAudit,
    'scripts/zenit-clean-legacy-quotes.mjs': validCleaner,
    'scripts/zenit-clean-e2e-fixtures.mjs': validE2eCleaner,
    'lib/constants/adminTestArtifacts.json': validAdminTestArtifactsConfig,
    'lib/constants/postEventWorkflow.json': validPostEventWorkflowConfig,
    'lib/services/postEventPendingService.ts': validPostEventPendingService,
    'app/admin/post-event/page.tsx': validPostEventHubPage,
    'app/admin/post-event/reports/page.tsx': validPostEventReportsPage,
    'app/admin/post-event/feedback/page.tsx': validPostEventFeedbackPage,
    'lib/services/postEventPlaybookService.ts': validPostEventPlaybookService,
    'app/admin/post-event/playbook/page.tsx': validPostEventPlaybookPage,
    'lib/services/adminQuoteEmailService.ts': validAdminQuoteEmailService,
    'lib/services/customQuoteAdminService.ts': validCustomQuoteAdminService,
    'lib/services/leads/quoteRouteHandler.ts': validLeadQuoteRouteHandler,
    'lib/services/leadDocumentService.ts': validLeadDocumentService,
    ...overrides,
  };
}

describe('check-zenit-tooling', () => {
  it('passa amb scripts canònics, audit read-only i cleaner dry-run', () => {
    const result = runGuard(validFiles());

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[zenit-tooling] OK');
  });

  it('falla si validate:core no executa el guard', () => {
    const result = runGuard(validFiles({
      'package.json': packageJson('pnpm run qa:protocol'),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('validate:core');
  });

  it('falla si l auditoria muta BD', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': `${validAudit}\nawait prisma.leadDocument.update({ where: { id: 'x' }, data: {} });\n`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('read-only');
  });

  it('falla si l auditoria no cobreix propostes acceptades sense reserva', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace('const acceptedProposalsWithoutBooking = [];\n', '')
        .replace('void acceptedProposalsWithoutBooking;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('acceptedProposalsWithoutBooking');
  });

  it('falla si l auditoria no cobreix EmailSend de pressupost sense traça Proposal', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace("const PROPOSAL_EMAIL_TEMPLATE_KEY = 'proposal-send';\n", '')
        .replace('const proposalEmailTraceMismatches = [];\n', '')
        .replace('const proposalEmailTemplateKeyAudited = PROPOSAL_EMAIL_TEMPLATE_KEY;\n', '')
        .replace('void proposalEmailTraceMismatches;\n', '')
        .replace('void proposalEmailTemplateKeyAudited;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('proposalEmailTraceMismatches');
  });

  it('falla si l auditoria no cobreix quoteSnapshot canònic de Proposal enviat', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace("const QUOTE_SNAPSHOT_SAFETY = 'QUOTE_SNAPSHOT_V1';\n", '')
        .replace('const sentLikeProposalsMissingQuoteSnapshot = [];\n', '')
        .replace('const proposalQuoteSnapshotSafetyAudited = QUOTE_SNAPSHOT_SAFETY;\n', '')
        .replace('void sentLikeProposalsMissingQuoteSnapshot;\n', '')
        .replace('void proposalQuoteSnapshotSafetyAudited;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('sentLikeProposalsMissingQuoteSnapshot');
  });

  it('falla si l auditoria no cobreix divergencia EmailSend/PDF del Proposal', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace('const proposalEmailDocumentMismatches = [];\n', '')
        .replace("const proposalEmailDocumentLinkAudited = 'EmailSend.htmlBody -> Proposal.pdfUrl';\n", '')
        .replace('void proposalEmailDocumentMismatches;\n', '')
        .replace('void proposalEmailDocumentLinkAudited;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('proposalEmailDocumentMismatches');
  });

  it('falla si l auditoria no cobreix documents operatius finals sense PDF', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace('await prisma.invoice.findMany();\n', '')
        .replace('const activeInvoicesMissingPdf = [];\n', '')
        .replace('void activeInvoicesMissingPdf;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('activeInvoicesMissingPdf');
  });

  it('falla si l auditoria no cobreix post-event completat sense arrencar', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace('await prisma.booking.findMany();\n', '')
        .replace('const completedBookingsPostEventNotStarted = [];\n', '')
        .replace('void completedBookingsPostEventNotStarted;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('completedBookingsPostEventNotStarted');
  });

  it('falla si l auditoria post-event no declara la font única de finestra', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace("const POST_EVENT_WORKFLOW_CONFIG_PATH = 'lib/constants/postEventWorkflow.json';\n", '')
        .replace('const postEventWorkflowConfigPath = POST_EVENT_WORKFLOW_CONFIG_PATH;\n', '')
        .replace('const postEventEmailDueDays = 2;\n', '')
        .replace('void postEventWorkflowConfigPath;\n', '')
        .replace('void postEventEmailDueDays;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('POST_EVENT_WORKFLOW_CONFIG_PATH');
  });

  it('falla si l auditoria torna a hardcodejar dies post-event', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': `${validAudit}\nconst POST_EVENT_AUDIT_WINDOW_DAYS = 90;\n`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('postEventWorkflow.json');
  });

  it('falla si l auditoria no cobreix artefactes de prova Zenit', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-db-audit.mjs': validAudit
        .replace('await prisma.customer.findMany();\n', '')
        .replace('const adminTestArtifactCustomers = [];\n', '')
        .replace('const adminTestArtifactTextMarkersAudited = [];\n', '')
        .replace('void adminTestArtifactCustomers;\n', '')
        .replace('void adminTestArtifactTextMarkersAudited;\n', ''),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('adminTestArtifactCustomers');
  });

  it('falla si la font única de marcadors de prova perd un marcador Manolo', () => {
    const result = runGuard(validFiles({
      'lib/constants/adminTestArtifacts.json': JSON.stringify({
        textMarkers: ['@example.test', 'zenit e2e'],
        prefixMarkers: ['zenit whatsapp', 'zenit mail', 'zenit config', 'zenit admin'],
      }),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('zenit.e2e');
  });

  it('falla si la finestra post-event deixa de cobrir catch-up de 90 dies', () => {
    const result = runGuard(validFiles({
      'lib/constants/postEventWorkflow.json': JSON.stringify({
        emailDueDays: 2,
        startDueDays: 3,
        catchupWindowDays: 7,
        pendingTake: 50,
        automationTake: 20,
        playbookTake: 100,
        actionDueDays: {
          thank_you: 3,
          testimonial: 7,
          social_post: 14,
          referral_ask: 30,
        },
      }),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('catchupWindowDays');
  });

  it('falla si el servei de cues post-event perd algun builder canònic', () => {
    const result = runGuard(validFiles({
      'lib/services/postEventPendingService.ts': validPostEventPendingService
        .replace('export function buildPendingPostEventReportBookingWhere', 'function buildPendingPostEventReportBookingWhere'),
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('buildPendingPostEventReportBookingWhere');
  });

  it('falla si el hub post-event torna a fer una query local de reports pendents', () => {
    const result = runGuard(validFiles({
      'app/admin/post-event/page.tsx': `
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
export async function getPostEventData() {
  await prisma.booking.findMany({ where: { status: 'COMPLETED', postEventReport: null }, take: 50 });
  return POST_EVENT_WORKFLOW.pendingTake;
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/admin/post-event/page.tsx');
    expect(result.stderr).toContain('buildPendingPostEventReportBookingWhere');
  });

  it('falla si reports post-event torna al limit local de 5', () => {
    const result = runGuard(validFiles({
      'app/admin/post-event/reports/page.tsx': `
import { buildPendingPostEventReportBookingWhere } from '@/lib/services/postEventPendingService';
export async function getAvailableBookings() {
  return prisma.booking.findMany({ where: buildPendingPostEventReportBookingWhere(), take: 5 });
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('reports/page.tsx');
    expect(result.stderr).toContain('pendingTake');
  });

  it('falla si feedback post-event torna a filtrar amb eventDate local', () => {
    const result = runGuard(validFiles({
      'app/admin/post-event/feedback/page.tsx': `
import { POST_EVENT_WORKFLOW } from '@/lib/constants/postEventWorkflow';
import { buildPendingPostEventFeedbackBookingWhere } from '@/lib/services/postEventPendingService';
export async function getCompletedBookings() {
  await prisma.booking.findMany({ where: { status: 'COMPLETED', eventDate: { lt: new Date() } }, take: POST_EVENT_WORKFLOW.pendingTake });
  return buildPendingPostEventFeedbackBookingWhere();
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('feedback/page.tsx');
    expect(result.stderr).toContain('eventDate lt new Date');
  });

  it('falla si el playbook post-event torna a duplicar dies o limit local', () => {
    const result = runGuard(validFiles({
      'lib/services/postEventPlaybookService.ts': `
const DAY_MS = 1000 * 60 * 60 * 24;
const ACTION_DUE_DAYS = {
  thank_you: 3,
  testimonial: 7,
  social_post: 14,
  referral_ask: 30,
};
export async function loadPostEventPlaybook(now = new Date(), daysWindow = 90) {
  const from = new Date(now.getTime() - daysWindow * DAY_MS);
  await prisma.booking.findMany({ where: { eventDate: { gte: from, lte: now } }, take: 100 });
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('postEventPlaybookService.ts');
    expect(result.stderr).toContain('POST_EVENT_WORKFLOW.actionDueDays');
  });

  it('falla si el copy del playbook hardcodeja la finestra de 90 dies', () => {
    const result = runGuard(validFiles({
      'app/admin/post-event/playbook/page.tsx': `
export default function PlaybookPage() {
  return <p>Les reserves completades dels últims 90 dies apareixen aquí.</p>;
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('playbook/page.tsx');
    expect(result.stderr).toContain('90 dies');
  });

  it('falla si el cleaner no exigeix dry-run abans d aplicar', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-clean-legacy-quotes.mjs': `
const LEGACY_QUOTE_PREFIX = 'quote-email:';
await prisma.leadDocument.deleteMany({
  where: { fileUrl: { startsWith: LEGACY_QUOTE_PREFIX }, filePath: null },
});
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DRY-RUN');
    expect(result.stderr).toContain('--apply');
  });

  it('falla si el cleaner de fixtures E2E no exigeix dry-run/transaccio', () => {
    const result = runGuard(validFiles({
      'scripts/zenit-clean-e2e-fixtures.mjs': `
const NAME_PREFIX = 'ZENIT E2E';
await prisma.lead.deleteMany({ where: { name: { startsWith: NAME_PREFIX } } });
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('zenit-clean-e2e-fixtures.mjs');
  });

  it('falla si el servei legacy emails/quote torna a enviar', () => {
    const result = runGuard(validFiles({
      'lib/services/adminQuoteEmailService.ts': `
export async function sendAdminQuoteEmail() {
  await sendEmail({});
  return { status: 200, body: {} };
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('adminQuoteEmailService.ts');
    expect(result.stderr).toContain('/api/admin/proposals/:id/send');
  });

  it('falla si customQuoteAdminService torna a mutar custom_quotes', () => {
    const result = runGuard(validFiles({
      'lib/services/customQuoteAdminService.ts': `
export const CUSTOM_QUOTE_RETIRED_ERROR = 'retirat';
export async function createAdminCustomQuote() {
  await prisma.customQuote.create({ data: {} });
  return { status: 200, body: { canonicalRoute: '/admin/presupuestos' } };
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('customQuoteAdminService.ts');
    expect(result.stderr).toContain('carril retirat');
  });

  it('falla si el lead quote legacy torna a crear LeadDocument QUOTE', () => {
    const result = runGuard(validFiles({
      'lib/services/leads/quoteRouteHandler.ts': `
export function buildLegacyQuoteDisabledResponse() {
  return Response.json({}, { status: 410 });
}
export async function handleLeadQuotePost() {
  await prisma.leadDocument.create({ data: { type: 'QUOTE' } });
  return Response.json({ canonicalRoute: '/admin/presupuestos' }, { status: 200 });
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('quoteRouteHandler.ts');
    expect(result.stderr).toContain('LeadDocument');
  });

  it('falla si uploadLeadDocument deixa de rebutjar QUOTE', () => {
    const result = runGuard(validFiles({
      'lib/services/leadDocumentService.ts': `
export async function uploadLeadDocument() {
  const rawType = 'QUOTE';
  return { status: 200, body: { type: rawType } };
}
`,
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('leadDocumentService.ts');
    expect(result.stderr).toContain("rawType === 'QUOTE'");
  });
});
