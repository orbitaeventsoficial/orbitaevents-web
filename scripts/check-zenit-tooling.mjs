#!/usr/bin/env node
// qa:zenit-tooling - scripts Zenit sensibles han de ser repo-nadius, dry-run i connectats al validate.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = {
  packageJson: path.join(ROOT, 'package.json'),
  audit: path.join(ROOT, 'scripts', 'zenit-db-audit.mjs'),
  cleaner: path.join(ROOT, 'scripts', 'zenit-clean-legacy-quotes.mjs'),
  e2eCleaner: path.join(ROOT, 'scripts', 'zenit-clean-e2e-fixtures.mjs'),
  adminTestArtifacts: path.join(ROOT, 'lib', 'constants', 'adminTestArtifacts.json'),
  postEventWorkflow: path.join(ROOT, 'lib', 'constants', 'postEventWorkflow.json'),
  postEventPendingService: path.join(ROOT, 'lib', 'services', 'postEventPendingService.ts'),
  postEventHubPage: path.join(ROOT, 'app', 'admin', 'post-event', 'page.tsx'),
  postEventReportsPage: path.join(ROOT, 'app', 'admin', 'post-event', 'reports', 'page.tsx'),
  postEventFollowUpPage: path.join(ROOT, 'app', 'admin', 'post-event', 'seguiment', 'page.tsx'),
  postEventPlaybookService: path.join(ROOT, 'lib', 'services', 'postEventPlaybookService.ts'),
  postEventPlaybookPage: path.join(ROOT, 'app', 'admin', 'post-event', 'playbook', 'page.tsx'),
  adminQuoteEmailService: path.join(ROOT, 'lib', 'services', 'adminQuoteEmailService.ts'),
  customQuoteAdminService: path.join(ROOT, 'lib', 'services', 'customQuoteAdminService.ts'),
  leadQuoteRouteHandler: path.join(ROOT, 'lib', 'services', 'leads', 'quoteRouteHandler.ts'),
  leadDocumentService: path.join(ROOT, 'lib', 'services', 'leadDocumentService.ts'),
};

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function readText(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`falta ${rel(file)}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function activeSource(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .join('\n');
}

function checkPackageJson(source) {
  let pkg;
  try {
    pkg = JSON.parse(source);
  } catch (error) {
    return [`package.json: JSON invalid (${error.message})`];
  }

  const scripts = pkg.scripts ?? {};
  const expected = {
    'zenit:db:audit': 'node scripts/zenit-db-audit.mjs',
    'zenit:clean:legacy-quotes': 'node scripts/zenit-clean-legacy-quotes.mjs',
    'zenit:clean:e2e-fixtures': 'node scripts/zenit-clean-e2e-fixtures.mjs',
    'qa:zenit-tooling': 'node scripts/check-zenit-tooling.mjs',
  };
  const errors = [];

  for (const [name, command] of Object.entries(expected)) {
    if (scripts[name] !== command) {
      errors.push(`package.json: falta script "${name}" canonic`);
    }
  }

  if (!String(scripts['validate:core'] ?? '').includes('pnpm run qa:zenit-tooling')) {
    errors.push('package.json: validate:core no executa "pnpm run qa:zenit-tooling"');
  }

  return errors;
}

function checkAuditScript(source) {
  const errors = [];
  const active = activeSource(source);
  const mutationPattern = /\.(deleteMany|delete|updateMany|update|createMany|create|upsert)\s*\(|\$executeRaw|\$queryRawUnsafe/;

  if (mutationPattern.test(active)) {
    errors.push('scripts/zenit-db-audit.mjs: ha de ser read-only; no pot mutar BD');
  }

  if (/const\s+POST_EVENT_AUDIT_WINDOW_DAYS\s*=\s*90\b/.test(active) || /const\s+POST_EVENT_START_DUE_DAYS\s*=\s*3\b/.test(active)) {
    errors.push('scripts/zenit-db-audit.mjs: la finestra post-event ha de sortir de lib/constants/postEventWorkflow.json');
  }

  for (const required of [
    "const LEGACY_QUOTE_PREFIX = 'quote-email:';",
    'prisma.leadDocument.findMany',
    'prisma.customer.findMany',
    'prisma.lead.findMany',
    'prisma.dossier.findMany',
    'prisma.proposal.findMany',
    'prisma.booking.findMany',
    'prisma.invoice.findMany',
    'prisma.deliveryNote.findMany',
    'prisma.emailSend.findMany',
    'prisma.leadNote.findMany',
    'prisma.leadActivity.findMany',
    'prisma.customQuote.findMany',
    'ADMIN_TEST_ARTIFACT_CONFIG_PATH',
    'POST_EVENT_WORKFLOW_CONFIG_PATH',
    "const PROPOSAL_EMAIL_TEMPLATE_KEY = 'proposal-send';",
    "const QUOTE_SNAPSHOT_SAFETY = 'QUOTE_SNAPSHOT_V1';",
    'sentLikeProposalsIncompleteDispatch',
    'sentLikeProposalsMissingQuoteSnapshot',
    'proposalEmailTraceMismatches',
    'proposalEmailDocumentMismatches',
    'acceptedProposalsWithoutBooking',
    'advancedContractsMissingArtifact',
    'activeInvoicesMissingPdf',
    'advancedDeliveryNotesMissingPdf',
    'completedBookingsPostEventNotStarted',
    'postEventEmailFlagWithoutSentAt',
    'adminTestArtifactCustomers',
    'adminTestArtifactLeads',
    'adminTestArtifactBookings',
    'adminTestArtifactDossiers',
    'adminTestArtifactProposals',
    'adminTestArtifactEmailSends',
    'adminTestArtifactLeadDocuments',
    'adminTestArtifactLeadNotes',
    'adminTestArtifactLeadActivities',
    'postEventAuditWindowDays',
    'postEventWorkflowConfigPath',
    'postEventEmailDueDays',
    'adminTestArtifactTextMarkersAudited',
    'adminTestArtifactPrefixMarkersAudited',
    'proposalEmailTemplateKeyAudited',
    'proposalEmailOrbitaKindAudited',
    'proposalQuoteSnapshotSafetyAudited',
    'proposalEmailDocumentLinkAudited',
    'acceptedProposalStatusesAudited',
    'activeInvoiceStatusesAudited',
    'advancedDeliveryNoteStatusesAudited',
    'Proposal SENT/VIEWED amb PDF però sense quoteSnapshot canònic',
    'EmailSend de pressupost sense traça orbitaKind=proposal',
    'EmailSend de pressupost amb link/PDF divergent del Proposal',
    'Proposal ACCEPTED sense bookingId',
    'Contracte SENT/SIGNED sense contractPdfUrl/contractPdfKey',
    'Factura activa sense pdfUrl/pdfKey',
    'Albara DELIVERED/SIGNED sense pdfUrl/pdfKey',
    'Booking COMPLETED post-event sense arrencar',
    'postEventEmailSent=true sense postEventEmailSentAt',
    'Artefactes de prova Zenit',
    'Handoff a Claude',
    'No escriu res. No elimina res.',
  ]) {
    if (!source.includes(required)) {
      errors.push(`scripts/zenit-db-audit.mjs: falta "${required}"`);
    }
  }

  return errors;
}

function checkAdminTestArtifactsConfig(source) {
  const errors = [];
  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    return [`lib/constants/adminTestArtifacts.json: JSON invalid (${error.message})`];
  }

  const textMarkers = Array.isArray(config.textMarkers) ? config.textMarkers : [];
  const prefixMarkers = Array.isArray(config.prefixMarkers) ? config.prefixMarkers : [];
  for (const required of ['@example.test', 'zenit e2e', 'zenit.e2e']) {
    if (!textMarkers.includes(required)) {
      errors.push(`lib/constants/adminTestArtifacts.json: falta textMarkers "${required}"`);
    }
  }
  for (const required of ['zenit whatsapp', 'zenit mail', 'zenit config', 'zenit admin']) {
    if (!prefixMarkers.includes(required)) {
      errors.push(`lib/constants/adminTestArtifacts.json: falta prefixMarkers "${required}"`);
    }
  }

  return errors;
}

function checkPostEventWorkflowConfig(source) {
  const errors = [];
  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    return [`lib/constants/postEventWorkflow.json: JSON invalid (${error.message})`];
  }

  const expected = {
    emailDueDays: 2,
    startDueDays: 3,
    catchupWindowDays: 90,
    pendingTake: 50,
    automationTake: 20,
    playbookTake: 100,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (config[key] !== value) {
      errors.push(`lib/constants/postEventWorkflow.json: ${key} ha de ser ${value}`);
    }
  }

  const actionDueDays = config.actionDueDays && typeof config.actionDueDays === 'object'
    ? config.actionDueDays
    : {};
  const expectedActionDueDays = {
    thank_you: config.startDueDays,
    testimonial: 7,
    social_post: 14,
    referral_ask: 30,
  };
  for (const [key, value] of Object.entries(expectedActionDueDays)) {
    if (actionDueDays[key] !== value) {
      errors.push(`lib/constants/postEventWorkflow.json: actionDueDays.${key} ha de ser ${value}`);
    }
  }

  return errors;
}

function checkPostEventPlaybookService(source) {
  const errors = [];
  const active = activeSource(source);

  for (const required of [
    "from '@/lib/constants/postEventWorkflow'",
    'getPostEventWorkflowDates(now)',
    'POST_EVENT_WORKFLOW.actionDueDays',
    'POST_EVENT_WORKFLOW.playbookTake',
    'POST_EVENT_DAY_MS',
  ]) {
    if (!source.includes(required)) {
      errors.push(`lib/services/postEventPlaybookService.ts: falta "${required}"`);
    }
  }

  for (const [pattern, label] of [
    [/const\s+DAY_MS\s*=/, 'DAY_MS local'],
    [/daysWindow\s*=\s*90\b/, 'daysWindow=90'],
    [/thank_you\s*:\s*3\b/, 'thank_you: 3'],
    [/take:\s*100\b/, 'take: 100'],
  ]) {
    if (pattern.test(active)) {
      errors.push(`lib/services/postEventPlaybookService.ts: no pot duplicar la norma post-event (${label})`);
    }
  }

  return errors;
}

function checkPostEventPendingService(source) {
  const errors = [];

  for (const required of [
    'export function buildPendingPostEventEmailBookingWhere',
    'export function buildPendingPostEventFollowUpBookingWhere',
    'export function buildPendingPostEventReportBookingWhere',
    'export function buildPendingPostEventSurveyBookingWhere',
    'export function buildNotStartedPostEventBookingWhere',
    'getPostEventWorkflowDates(now)',
    'PLACEHOLDER_EMAIL_DOMAIN',
  ]) {
    if (!source.includes(required)) {
      errors.push(`lib/services/postEventPendingService.ts: falta "${required}"`);
    }
  }

  return errors;
}

function checkPostEventAdminQueuePage(source, fileLabel, requiredBuilders) {
  const errors = [];
  const active = activeSource(source);

  for (const required of requiredBuilders) {
    if (!source.includes(required)) {
      errors.push(`${fileLabel}: ha de consumir ${required}`);
    }
  }

  if (!source.includes('POST_EVENT_WORKFLOW.pendingTake')) {
    errors.push(`${fileLabel}: el limit de cua post-event ha de sortir de POST_EVENT_WORKFLOW.pendingTake`);
  }

  for (const [pattern, label] of [
    [/take:\s*(5|50)\b/, 'take local 5/50'],
    [/eventDate:\s*\{\s*lt:\s*new Date\(\)\s*\}/, 'eventDate lt new Date local'],
    [/status:\s*'COMPLETED'[\s\S]{0,160}postEventReport:\s*null/, 'where local postEventReport null'],
    [/status:\s*'COMPLETED'[\s\S]{0,160}clientSurvey:\s*null/, 'where local clientSurvey null'],
  ]) {
    if (pattern.test(active)) {
      errors.push(`${fileLabel}: no pot duplicar la cua post-event (${label})`);
    }
  }

  return errors;
}

function checkPostEventPlaybookPage(source) {
  const errors = [];
  const active = activeSource(source);

  if (!source.includes('POST_EVENT_WORKFLOW.catchupWindowDays')) {
    errors.push('app/admin/post-event/playbook/page.tsx: el copy de finestra ha de sortir de POST_EVENT_WORKFLOW.catchupWindowDays');
  }

  if (/últims\s+90\s+dies|darrers\s+90\s+dies|ultims\s+90\s+dies/i.test(active)) {
    errors.push('app/admin/post-event/playbook/page.tsx: no pot hardcodejar "90 dies" al copy del playbook');
  }

  return errors;
}

function checkCleanerScript(source) {
  const errors = [];

  for (const required of [
    "const LEGACY_QUOTE_PREFIX = 'quote-email:';",
    "const apply = args.has('--apply');",
    'if (!apply)',
    'DRY-RUN',
    'deleteMany',
    "fileUrl: { startsWith: LEGACY_QUOTE_PREFIX }",
    'filePath: null',
  ]) {
    if (!source.includes(required)) {
      errors.push(`scripts/zenit-clean-legacy-quotes.mjs: falta "${required}"`);
    }
  }

  return errors;
}

function checkE2eCleanerScript(source) {
  const errors = [];

  for (const required of [
    "path.join(process.cwd(), 'lib', 'constants', 'adminTestArtifacts.json')",
    'adminTestArtifactWhere',
    "const apply = args.has('--apply');",
    'if (!apply)',
    'DRY-RUN',
    '$transaction',
    'deleteMany',
  ]) {
    if (!source.includes(required)) {
      errors.push(`scripts/zenit-clean-e2e-fixtures.mjs: falta "${required}"`);
    }
  }

  return errors;
}

function checkAdminQuoteEmailService(source) {
  const errors = [];
  const active = activeSource(source);

  for (const required of [
    'status: 410',
    "canonicalRoute: '/api/admin/proposals/:id/send'",
    'Flux antic de pressupost desactivat',
  ]) {
    if (!source.includes(required)) {
      errors.push(`lib/services/adminQuoteEmailService.ts: falta "${required}"`);
    }
  }

  for (const forbidden of ['sendEmail(', 'nodemailer', 'prisma.emailSend.create']) {
    if (active.includes(forbidden)) {
      errors.push(`lib/services/adminQuoteEmailService.ts: no pot reactivar enviament legacy (${forbidden})`);
    }
  }

  return errors;
}

function checkCustomQuoteAdminService(source) {
  const errors = [];
  const active = activeSource(source);
  const mutationPattern = /prisma\.customQuote\.(create|createMany|update|updateMany|delete|deleteMany|upsert)\s*\(/;

  for (const required of [
    'CUSTOM_QUOTE_RETIRED_ERROR',
    'status: 410',
    "canonicalRoute: '/admin/presupuestos'",
  ]) {
    if (!source.includes(required)) {
      errors.push(`lib/services/customQuoteAdminService.ts: falta "${required}"`);
    }
  }

  if (mutationPattern.test(active)) {
    errors.push('lib/services/customQuoteAdminService.ts: no pot mutar custom_quotes; carril retirat');
  }

  return errors;
}

function checkLeadQuoteRouteHandler(source) {
  const errors = [];
  const active = activeSource(source);
  const mutationPattern = /prisma\.leadDocument\.(create|createMany|update|updateMany|delete|deleteMany|upsert)\s*\(/;

  for (const required of [
    'buildLegacyQuoteDisabledResponse',
    'status: 410',
    "canonicalRoute: '/admin/presupuestos'",
    'Flux antic de pressupost desactivat',
  ]) {
    if (!source.includes(required)) {
      errors.push(`lib/services/leads/quoteRouteHandler.ts: falta "${required}"`);
    }
  }

  if (mutationPattern.test(active)) {
    errors.push('lib/services/leads/quoteRouteHandler.ts: no pot mutar LeadDocument; carril QUOTE retirat');
  }

  if (active.includes('sendEmail(')) {
    errors.push('lib/services/leads/quoteRouteHandler.ts: no pot enviar email pel carril QUOTE retirat');
  }

  return errors;
}

function checkLeadDocumentService(source) {
  const errors = [];

  for (const required of [
    "rawType === 'QUOTE'",
    'status: 410',
    "canonicalRoute: '/admin/presupuestos'",
    'Els pressupostos LeadDocument estan desactivats',
  ]) {
    if (!source.includes(required)) {
      errors.push(`lib/services/leadDocumentService.ts: falta "${required}"`);
    }
  }

  return errors;
}

const errors = [];

try {
  errors.push(...checkPackageJson(readText(FILES.packageJson)));
  errors.push(...checkAuditScript(readText(FILES.audit)));
  errors.push(...checkCleanerScript(readText(FILES.cleaner)));
  errors.push(...checkE2eCleanerScript(readText(FILES.e2eCleaner)));
  errors.push(...checkAdminTestArtifactsConfig(readText(FILES.adminTestArtifacts)));
  errors.push(...checkPostEventWorkflowConfig(readText(FILES.postEventWorkflow)));
  errors.push(...checkPostEventPendingService(readText(FILES.postEventPendingService)));
  errors.push(...checkPostEventAdminQueuePage(
    readText(FILES.postEventHubPage),
    'app/admin/post-event/page.tsx',
    ['buildPendingPostEventReportBookingWhere', 'buildPendingPostEventSurveyBookingWhere'],
  ));
  errors.push(...checkPostEventAdminQueuePage(
    readText(FILES.postEventReportsPage),
    'app/admin/post-event/reports/page.tsx',
    ['buildPendingPostEventReportBookingWhere'],
  ));
  errors.push(...checkPostEventAdminQueuePage(
    readText(FILES.postEventFollowUpPage),
    'app/admin/post-event/seguiment/page.tsx',
    ['buildPendingPostEventFollowUpBookingWhere'],
  ));
  errors.push(...checkPostEventPlaybookService(readText(FILES.postEventPlaybookService)));
  errors.push(...checkPostEventPlaybookPage(readText(FILES.postEventPlaybookPage)));
  errors.push(...checkAdminQuoteEmailService(readText(FILES.adminQuoteEmailService)));
  errors.push(...checkCustomQuoteAdminService(readText(FILES.customQuoteAdminService)));
  errors.push(...checkLeadQuoteRouteHandler(readText(FILES.leadQuoteRouteHandler)));
  errors.push(...checkLeadDocumentService(readText(FILES.leadDocumentService)));
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (errors.length === 0) {
  console.log('[zenit-tooling] OK - scripts Zenit sensibles amb dry-run, auditoria read-only i validate connectat');
  process.exit(0);
}

process.stderr.write(`[zenit-tooling] FAIL - ${errors.length} incidencia(es)\n`);
for (const error of errors) {
  process.stderr.write(`  ${error}\n`);
}
process.exit(1);
