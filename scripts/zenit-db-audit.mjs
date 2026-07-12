#!/usr/bin/env node
// Auditoria BD Manolo/Zenit: lectura segura de carrils comercials legacy i artefactes documentals incomplets.
import fs from 'node:fs';
import path from 'node:path';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;

const args = new Set(process.argv.slice(2));
const LEGACY_QUOTE_PREFIX = 'quote-email:';
const PROPOSAL_EMAIL_TEMPLATE_KEY = 'proposal-send';
const QUOTE_SNAPSHOT_SAFETY = 'QUOTE_SNAPSHOT_V1';
const MAX_SAMPLE_ROWS = 50;
const SENT_LIKE_PROPOSAL_STATUSES = ['SENT', 'VIEWED'];
const ACCEPTED_PROPOSAL_STATUS = 'ACCEPTED';
const ADVANCED_CONTRACT_STATUSES = ['SENT', 'SIGNED'];
const ACTIVE_INVOICE_STATUSES = ['DRAFT', 'PENDING_SYNC', 'SYNCED', 'SYNC_ERROR', 'PAID'];
const ADVANCED_DELIVERY_NOTE_STATUSES = ['DELIVERED', 'SIGNED'];
const DAY_MS = 1000 * 60 * 60 * 24;
const ADMIN_TEST_ARTIFACT_CONFIG_PATH = path.join(process.cwd(), 'lib', 'constants', 'adminTestArtifacts.json');
const POST_EVENT_WORKFLOW_CONFIG_PATH = path.join(process.cwd(), 'lib', 'constants', 'postEventWorkflow.json');

function loadAdminTestArtifactConfig() {
  const raw = JSON.parse(fs.readFileSync(ADMIN_TEST_ARTIFACT_CONFIG_PATH, 'utf8'));
  return {
    textMarkers: Array.isArray(raw.textMarkers) ? raw.textMarkers.map((value) => String(value).trim()).filter(Boolean) : [],
    prefixMarkers: Array.isArray(raw.prefixMarkers) ? raw.prefixMarkers.map((value) => String(value).trim()).filter(Boolean) : [],
  };
}

const adminTestArtifactConfig = loadAdminTestArtifactConfig();
const ADMIN_TEST_ARTIFACT_TEXT_MARKERS = adminTestArtifactConfig.textMarkers;
const ADMIN_TEST_ARTIFACT_PREFIX_MARKERS = adminTestArtifactConfig.prefixMarkers;

function loadPostEventWorkflowConfig() {
  const raw = JSON.parse(fs.readFileSync(POST_EVENT_WORKFLOW_CONFIG_PATH, 'utf8'));
  return {
    emailDueDays: Number(raw.emailDueDays),
    startDueDays: Number(raw.startDueDays),
    catchupWindowDays: Number(raw.catchupWindowDays),
  };
}

const postEventWorkflowConfig = loadPostEventWorkflowConfig();
const POST_EVENT_AUDIT_WINDOW_DAYS = postEventWorkflowConfig.catchupWindowDays;
const POST_EVENT_START_DUE_DAYS = postEventWorkflowConfig.startDueDays;

function printHelp() {
  console.log([
    'Us: pnpm run zenit:db:audit',
    '',
    'Llegeix BD i retorna un report JSON de restes comercials sensibles:',
    '- LeadDocument QUOTE i quote-email:*',
    '- Dossier mode=quote',
    '- Proposal SENT/VIEWED sense pdfUrl/pdfKey/sentAt',
    '- Proposal SENT/VIEWED amb PDF però sense quoteSnapshot canònic',
    '- EmailSend de pressupost sense traça orbitaKind=proposal',
    '- EmailSend de pressupost amb link/PDF divergent del Proposal',
    '- Proposal ACCEPTED sense bookingId',
    '- Contracte SENT/SIGNED sense contractPdfUrl/contractPdfKey',
    '- Factura activa sense pdfUrl/pdfKey',
    '- Albara DELIVERED/SIGNED sense pdfUrl/pdfKey',
    '- Booking COMPLETED post-event sense arrencar',
    '- postEventEmailSent=true sense postEventEmailSentAt',
    '- Artefactes de prova Zenit en Customer/Lead/Booking/Dossier/Proposal/Email/LeadDocument/LeadNote/LeadActivity',
    '- custom_quotes històrics retirats',
    '- senyals EmailSend potencialment relacionats amb pressupostos legacy',
    '',
    'No escriu res. No elimina res.',
  ].join('\n'));
}

function serialize(value) {
  return JSON.stringify(value, (_key, inner) => {
    if (inner instanceof Date) return inner.toISOString();
    return inner;
  }, 2);
}

function summarizeRows(rows) {
  return {
    count: rows.length,
    sample: rows,
  };
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function moneyMatches(left, right) {
  const leftNumber = asNumber(left);
  const rightNumber = asNumber(right);
  return leftNumber !== null && rightNumber !== null && Math.abs(leftNumber - rightNumber) < 0.005;
}

function compactSentLikeProposalSnapshotMismatch(proposal) {
  const snapshot = asRecord(proposal.snapshot);
  const quoteSnapshot = asRecord(snapshot.quoteSnapshot);
  const trace = asRecord(quoteSnapshot.trace);
  const pricing = asRecord(quoteSnapshot.pricing);
  const reasons = [];

  if (quoteSnapshot.documentType !== 'PROPOSAL') reasons.push('quoteSnapshot.documentType');
  if (quoteSnapshot.proposalId !== proposal.id) reasons.push('quoteSnapshot.proposalId');
  if (quoteSnapshot.reference !== proposal.reference) reasons.push('quoteSnapshot.reference');
  if (trace.safety !== QUOTE_SNAPSHOT_SAFETY) reasons.push('quoteSnapshot.trace.safety');
  if (!moneyMatches(pricing.total, proposal.total)) reasons.push('quoteSnapshot.pricing.total');

  if (reasons.length === 0) return null;

  return {
    id: proposal.id,
    reference: proposal.reference,
    status: proposal.status,
    customerId: proposal.customerId,
    leadId: proposal.leadId,
    bookingId: proposal.bookingId,
    total: proposal.total,
    snapshotTotal: asNumber(pricing.total),
    snapshotDocumentType: asText(quoteSnapshot.documentType) || null,
    snapshotProposalId: asText(quoteSnapshot.proposalId) || null,
    snapshotReference: asText(quoteSnapshot.reference) || null,
    snapshotSafety: asText(trace.safety) || null,
    pdfUrl: proposal.pdfUrl,
    pdfKey: proposal.pdfKey,
    sentAt: proposal.sentAt,
    updatedAt: proposal.updatedAt,
    reasons,
  };
}

function urlVariants(value) {
  const trimmed = asText(value);
  if (!trimmed) return [];
  const variants = new Set([trimmed]);
  try {
    const parsed = new URL(trimmed);
    variants.add(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    // Relative URLs are already represented by the raw value.
  }
  return [...variants].filter(Boolean);
}

function containsAny(haystack, needles) {
  const text = asText(haystack);
  return text.length > 0 && needles.some((needle) => text.includes(needle));
}

function compactProposalEmailDocumentMismatch(emailSend, proposal) {
  const subject = asText(emailSend.subject);
  const htmlBody = asText(emailSend.htmlBody);
  const reasons = [];

  if (!htmlBody) reasons.push('htmlBody.missing');

  if (!proposal) {
    reasons.push('proposal.missing');
  } else {
    const reference = asText(proposal.reference);
    const pdfUrl = asText(proposal.pdfUrl);

    if (!reference) {
      reasons.push('proposal.reference');
    } else if (!subject.includes(reference)) {
      reasons.push('subject.reference');
    }

    if (!pdfUrl) {
      reasons.push('proposal.pdfUrl');
    } else if (htmlBody && !containsAny(htmlBody, urlVariants(pdfUrl))) {
      reasons.push('htmlBody.pdfUrl');
    }
  }

  if (reasons.length === 0) return null;

  return {
    id: emailSend.id,
    templateKey: emailSend.templateKey,
    to: emailSend.to,
    subject: emailSend.subject,
    leadId: emailSend.leadId,
    customerId: emailSend.customerId,
    orbitaKind: emailSend.orbitaKind,
    orbitaId: emailSend.orbitaId,
    orbitaOrigin: emailSend.orbitaOrigin,
    sentAt: emailSend.sentAt,
    htmlBodyLength: htmlBody.length,
    proposalReference: proposal?.reference ?? null,
    proposalPdfUrl: proposal?.pdfUrl ?? null,
    proposalStatus: proposal?.status ?? null,
    proposalSentAt: proposal?.sentAt ?? null,
    reasons,
  };
}

function adminTestArtifactFieldFilters(fields) {
  return fields.flatMap((field) => [
    ...ADMIN_TEST_ARTIFACT_TEXT_MARKERS.map((marker) => ({
      [field]: { contains: marker, mode: 'insensitive' },
    })),
    ...ADMIN_TEST_ARTIFACT_PREFIX_MARKERS.map((marker) => ({
      [field]: { startsWith: marker, mode: 'insensitive' },
    })),
  ]);
}

function adminTestArtifactWhere(fields) {
  return {
    OR: adminTestArtifactFieldFilters(fields),
  };
}

if (args.has('--help') || args.has('-h')) {
  printHelp();
  process.exit(0);
}

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function loadProposalStatusValues() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'ProposalStatus'
      ORDER BY enumsortorder
    `;
    return {
      values: rows.map((row) => String(row.enumlabel)),
      error: null,
    };
  } catch (error) {
    return {
      values: [],
      error: errorMessage(error),
    };
  }
}

async function main() {
  const proposalStatusProbe = await loadProposalStatusValues();
  const sentLikeProposalStatuses = (
    proposalStatusProbe.values.length > 0
      ? SENT_LIKE_PROPOSAL_STATUSES.filter((status) => proposalStatusProbe.values.includes(status))
      : ['SENT']
  );
  const acceptedProposalStatuses = (
    proposalStatusProbe.values.length > 0
      ? (proposalStatusProbe.values.includes(ACCEPTED_PROPOSAL_STATUS) ? [ACCEPTED_PROPOSAL_STATUS] : [])
      : [ACCEPTED_PROPOSAL_STATUS]
  );
  const now = new Date();
  const postEventAuditFrom = new Date(now.getTime() - POST_EVENT_AUDIT_WINDOW_DAYS * DAY_MS);
  const postEventStartDueBefore = new Date(now.getTime() - POST_EVENT_START_DUE_DAYS * DAY_MS);

  const [
    legacyLeadDocuments,
    legacyQuoteEmailDocuments,
    historicalQuoteDossiers,
    sentLikeProposalsIncompleteDispatch,
    sentLikeProposalsSnapshotAuditRows,
    proposalEmailTraceMismatches,
    proposalEmailSendsForDocumentAudit,
    acceptedProposalsWithoutBooking,
    advancedContractsMissingArtifact,
    activeInvoicesMissingPdf,
    advancedDeliveryNotesMissingPdf,
    completedBookingsPostEventNotStarted,
    postEventEmailFlagWithoutSentAt,
    adminTestArtifactCustomers,
    adminTestArtifactLeads,
    adminTestArtifactBookings,
    adminTestArtifactDossiers,
    adminTestArtifactProposals,
    adminTestArtifactEmailSends,
    adminTestArtifactLeadDocuments,
    adminTestArtifactLeadNotes,
    adminTestArtifactLeadActivities,
    retiredCustomQuotes,
    quoteEmailSignals,
  ] = await Promise.all([
    prisma.leadDocument.findMany({
      where: { type: 'QUOTE' },
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        leadId: true,
        title: true,
        fileUrl: true,
        filePath: true,
        createdAt: true,
      },
    }),
    prisma.leadDocument.findMany({
      where: {
        type: 'QUOTE',
        fileUrl: { startsWith: LEGACY_QUOTE_PREFIX },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        leadId: true,
        title: true,
        fileUrl: true,
        filePath: true,
        createdAt: true,
      },
    }),
    prisma.dossier.findMany({
      where: { mode: 'quote' },
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        leadId: true,
        nom: true,
        email: true,
        mode: true,
        sentAt: true,
        createdAt: true,
        deletedAt: true,
      },
    }),
    prisma.proposal.findMany({
      where: {
        status: { in: sentLikeProposalStatuses },
        OR: [
          { pdfUrl: null },
          { pdfUrl: '' },
          { pdfKey: null },
          { pdfKey: '' },
          { sentAt: null },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        status: true,
        customerId: true,
        leadId: true,
        bookingId: true,
        pdfUrl: true,
        pdfKey: true,
        sentAt: true,
        updatedAt: true,
      },
    }),
    prisma.proposal.findMany({
      where: {
        status: { in: sentLikeProposalStatuses },
        NOT: [
          { pdfUrl: null },
          { pdfUrl: '' },
          { pdfKey: null },
          { pdfKey: '' },
          { sentAt: null },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        status: true,
        customerId: true,
        leadId: true,
        bookingId: true,
        total: true,
        snapshot: true,
        pdfUrl: true,
        pdfKey: true,
        sentAt: true,
        updatedAt: true,
      },
    }),
    prisma.emailSend.findMany({
      where: {
        templateKey: PROPOSAL_EMAIL_TEMPLATE_KEY,
        OR: [
          { orbitaKind: { not: 'proposal' } },
          { orbitaKind: null },
          { orbitaId: null },
          { orbitaId: '' },
        ],
      },
      orderBy: { sentAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        templateKey: true,
        to: true,
        subject: true,
        leadId: true,
        customerId: true,
        orbitaKind: true,
        orbitaId: true,
        orbitaOrigin: true,
        smtpMessageId: true,
        sentAt: true,
      },
    }),
    prisma.emailSend.findMany({
      where: {
        templateKey: PROPOSAL_EMAIL_TEMPLATE_KEY,
        orbitaKind: 'proposal',
        orbitaId: { not: null },
        NOT: { orbitaId: '' },
      },
      orderBy: { sentAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        templateKey: true,
        to: true,
        subject: true,
        htmlBody: true,
        leadId: true,
        customerId: true,
        orbitaKind: true,
        orbitaId: true,
        orbitaOrigin: true,
        sentAt: true,
      },
    }),
    prisma.proposal.findMany({
      where: {
        status: { in: acceptedProposalStatuses },
        bookingId: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        status: true,
        customerId: true,
        leadId: true,
        bookingId: true,
        total: true,
        acceptedAt: true,
        sentAt: true,
        pdfUrl: true,
        pdfKey: true,
        updatedAt: true,
      },
    }),
    prisma.proposal.findMany({
      where: {
        contractStatus: { in: ADVANCED_CONTRACT_STATUSES },
        OR: [
          { contractReference: null },
          { contractReference: '' },
          { contractPdfUrl: null },
          { contractPdfUrl: '' },
          { contractPdfKey: null },
          { contractPdfKey: '' },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        status: true,
        customerId: true,
        leadId: true,
        bookingId: true,
        contractStatus: true,
        contractReference: true,
        contractPdfUrl: true,
        contractPdfKey: true,
        contractSentAt: true,
        contractSignedAt: true,
        updatedAt: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        status: { in: ACTIVE_INVOICE_STATUSES },
        OR: [
          { pdfUrl: null },
          { pdfUrl: '' },
          { pdfKey: null },
          { pdfKey: '' },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        status: true,
        bookingId: true,
        customerId: true,
        total: true,
        pdfUrl: true,
        pdfKey: true,
        holdedInvoiceUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.deliveryNote.findMany({
      where: {
        status: { in: ADVANCED_DELIVERY_NOTE_STATUSES },
        OR: [
          { pdfUrl: null },
          { pdfUrl: '' },
          { pdfKey: null },
          { pdfKey: '' },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        status: true,
        bookingId: true,
        customerId: true,
        pdfUrl: true,
        pdfKey: true,
        deliveredAt: true,
        signedAt: true,
        updatedAt: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        eventDate: {
          gte: postEventAuditFrom,
          lte: postEventStartDueBefore,
        },
        postEventEmailSent: false,
        postEventReport: null,
        clientSurvey: null,
      },
      orderBy: { eventDate: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        customerId: true,
        clientName: true,
        clientEmail: true,
        eventDate: true,
        postEventEmailSent: true,
        postEventEmailSentAt: true,
        updatedAt: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        postEventEmailSent: true,
        postEventEmailSentAt: null,
      },
      orderBy: { eventDate: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        customerId: true,
        clientName: true,
        clientEmail: true,
        eventDate: true,
        postEventEmailSent: true,
        postEventEmailSentAt: true,
        updatedAt: true,
      },
    }),
    prisma.customer.findMany({
      where: adminTestArtifactWhere(['name', 'email', 'phone']),
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        customerNumber: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.lead.findMany({
      where: adminTestArtifactWhere(['name', 'email', 'phone', 'eventLocation', 'message']),
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        customerId: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        eventDate: true,
        eventLocation: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.booking.findMany({
      where: adminTestArtifactWhere(['reference', 'clientName', 'clientEmail', 'clientPhone', 'eventLocation', 'eventVenue', 'notes']),
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        customerId: true,
        leadId: true,
        clientName: true,
        clientEmail: true,
        eventDate: true,
        status: true,
        eventLocation: true,
        eventVenue: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.dossier.findMany({
      where: adminTestArtifactWhere(['nom', 'empresa', 'telefon', 'email', 'eventDesc', 'salutacio', 'sentTo']),
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        leadId: true,
        nom: true,
        email: true,
        mode: true,
        sentAt: true,
        sentTo: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.proposal.findMany({
      where: {
        OR: [
          ...adminTestArtifactFieldFilters([
            'reference',
            'pdfUrl',
            'pdfKey',
            'contractReference',
            'contractPdfUrl',
            'contractPdfKey',
            'contractSignedBy',
          ]),
          { customer: { is: adminTestArtifactWhere(['name', 'email', 'phone']) } },
          { lead: { is: adminTestArtifactWhere(['name', 'email', 'phone', 'eventLocation', 'message']) } },
          { booking: { is: adminTestArtifactWhere(['reference', 'clientName', 'clientEmail', 'clientPhone', 'eventLocation', 'eventVenue', 'notes']) } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        reference: true,
        status: true,
        customerId: true,
        leadId: true,
        bookingId: true,
        sentAt: true,
        acceptedAt: true,
        pdfUrl: true,
        pdfKey: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, customerNumber: true, name: true, email: true } },
        lead: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, reference: true, clientName: true, clientEmail: true } },
      },
    }),
    prisma.emailSend.findMany({
      where: adminTestArtifactWhere(['templateKey', 'to', 'subject', 'orbitaKind', 'orbitaId', 'orbitaOrigin', 'smtpMessageId']),
      orderBy: { sentAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        templateKey: true,
        to: true,
        subject: true,
        leadId: true,
        customerId: true,
        orbitaKind: true,
        orbitaId: true,
        orbitaOrigin: true,
        sentAt: true,
      },
    }),
    prisma.leadDocument.findMany({
      where: adminTestArtifactWhere(['title', 'fileUrl', 'filePath']),
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        leadId: true,
        type: true,
        title: true,
        fileUrl: true,
        filePath: true,
        createdAt: true,
      },
    }),
    prisma.leadNote.findMany({
      where: adminTestArtifactWhere(['content', 'createdBy']),
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        leadId: true,
        content: true,
        createdBy: true,
        createdAt: true,
      },
    }),
    prisma.leadActivity.findMany({
      where: adminTestArtifactWhere(['title', 'description', 'createdBy']),
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        leadId: true,
        type: true,
        title: true,
        description: true,
        createdBy: true,
        createdAt: true,
      },
    }),
    prisma.customQuote.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        name: true,
        clientName: true,
        clientEmail: true,
        status: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.emailSend.findMany({
      where: {
        OR: [
          { templateKey: { contains: 'quote', mode: 'insensitive' } },
          { templateKey: { contains: 'pressupost', mode: 'insensitive' } },
          { subject: { contains: 'PRE-', mode: 'insensitive' } },
          { subject: { contains: 'pressupost', mode: 'insensitive' } },
          { orbitaKind: { contains: 'quote', mode: 'insensitive' } },
          { orbitaKind: { contains: 'proposal', mode: 'insensitive' } },
        ],
      },
      orderBy: { sentAt: 'desc' },
      take: MAX_SAMPLE_ROWS,
      select: {
        id: true,
        templateKey: true,
        to: true,
        subject: true,
        leadId: true,
        customerId: true,
        orbitaKind: true,
        orbitaId: true,
        orbitaOrigin: true,
        sentAt: true,
      },
    }),
  ]);

  const sentLikeProposalsMissingQuoteSnapshot = sentLikeProposalsSnapshotAuditRows
    .map(compactSentLikeProposalSnapshotMismatch)
    .filter(Boolean);
  const proposalEmailDocumentProposalIds = [
    ...new Set(proposalEmailSendsForDocumentAudit.map((emailSend) => asText(emailSend.orbitaId)).filter(Boolean)),
  ];
  const proposalEmailDocumentProposals = proposalEmailDocumentProposalIds.length > 0
    ? await prisma.proposal.findMany({
      where: { id: { in: proposalEmailDocumentProposalIds } },
      select: {
        id: true,
        reference: true,
        status: true,
        pdfUrl: true,
        sentAt: true,
      },
    })
    : [];
  const proposalById = new Map(proposalEmailDocumentProposals.map((proposal) => [proposal.id, proposal]));
  const proposalEmailDocumentMismatches = proposalEmailSendsForDocumentAudit
    .map((emailSend) => compactProposalEmailDocumentMismatch(emailSend, proposalById.get(asText(emailSend.orbitaId))))
    .filter(Boolean);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'read-only',
    legacyQuotePrefix: LEGACY_QUOTE_PREFIX,
    schemaProbe: {
      proposalStatusValues: proposalStatusProbe.values,
      proposalStatusProbeError: proposalStatusProbe.error,
      sentLikeProposalStatusesAudited: sentLikeProposalStatuses,
      acceptedProposalStatusesAudited: acceptedProposalStatuses,
      proposalEmailTemplateKeyAudited: PROPOSAL_EMAIL_TEMPLATE_KEY,
      proposalEmailOrbitaKindAudited: 'proposal',
      proposalQuoteSnapshotSafetyAudited: QUOTE_SNAPSHOT_SAFETY,
      proposalEmailDocumentLinkAudited: 'EmailSend.htmlBody -> Proposal.pdfUrl',
      advancedContractStatusesAudited: ADVANCED_CONTRACT_STATUSES,
      activeInvoiceStatusesAudited: ACTIVE_INVOICE_STATUSES,
      advancedDeliveryNoteStatusesAudited: ADVANCED_DELIVERY_NOTE_STATUSES,
      postEventAuditWindowDays: POST_EVENT_AUDIT_WINDOW_DAYS,
      postEventWorkflowConfigPath: POST_EVENT_WORKFLOW_CONFIG_PATH,
      postEventEmailDueDays: postEventWorkflowConfig.emailDueDays,
      postEventStartDueDays: POST_EVENT_START_DUE_DAYS,
      postEventAuditFrom,
      postEventStartDueBefore,
      adminTestArtifactConfigPath: ADMIN_TEST_ARTIFACT_CONFIG_PATH,
      adminTestArtifactTextMarkersAudited: ADMIN_TEST_ARTIFACT_TEXT_MARKERS,
      adminTestArtifactPrefixMarkersAudited: ADMIN_TEST_ARTIFACT_PREFIX_MARKERS,
      missingLocalStatusValues: SENT_LIKE_PROPOSAL_STATUSES.filter((status) => !proposalStatusProbe.values.includes(status)),
    },
    findings: {
      legacyLeadDocuments: summarizeRows(legacyLeadDocuments),
      legacyQuoteEmailDocuments: summarizeRows(legacyQuoteEmailDocuments),
      historicalQuoteDossiers: summarizeRows(historicalQuoteDossiers),
      sentLikeProposalsIncompleteDispatch: summarizeRows(sentLikeProposalsIncompleteDispatch),
      sentLikeProposalsMissingQuoteSnapshot: summarizeRows(sentLikeProposalsMissingQuoteSnapshot),
      proposalEmailTraceMismatches: summarizeRows(proposalEmailTraceMismatches),
      proposalEmailDocumentMismatches: summarizeRows(proposalEmailDocumentMismatches),
      acceptedProposalsWithoutBooking: summarizeRows(acceptedProposalsWithoutBooking),
      advancedContractsMissingArtifact: summarizeRows(advancedContractsMissingArtifact),
      activeInvoicesMissingPdf: summarizeRows(activeInvoicesMissingPdf),
      advancedDeliveryNotesMissingPdf: summarizeRows(advancedDeliveryNotesMissingPdf),
      completedBookingsPostEventNotStarted: summarizeRows(completedBookingsPostEventNotStarted),
      postEventEmailFlagWithoutSentAt: summarizeRows(postEventEmailFlagWithoutSentAt),
      adminTestArtifactCustomers: summarizeRows(adminTestArtifactCustomers),
      adminTestArtifactLeads: summarizeRows(adminTestArtifactLeads),
      adminTestArtifactBookings: summarizeRows(adminTestArtifactBookings),
      adminTestArtifactDossiers: summarizeRows(adminTestArtifactDossiers),
      adminTestArtifactProposals: summarizeRows(adminTestArtifactProposals),
      adminTestArtifactEmailSends: summarizeRows(adminTestArtifactEmailSends),
      adminTestArtifactLeadDocuments: summarizeRows(adminTestArtifactLeadDocuments),
      adminTestArtifactLeadNotes: summarizeRows(adminTestArtifactLeadNotes),
      adminTestArtifactLeadActivities: summarizeRows(adminTestArtifactLeadActivities),
      retiredCustomQuotes: summarizeRows(retiredCustomQuotes),
      quoteEmailSignals: summarizeRows(quoteEmailSignals),
    },
    nextSteps: {
      quoteEmailCleanup: legacyQuoteEmailDocuments.length > 0
        ? 'Executa pnpm run zenit:clean:legacy-quotes per veure el dry-run; afegeix -- --apply nomes si el diff es correcte.'
        : 'No hi ha LeadDocument quote-email:* a la mostra.',
      incompleteSentLikeProposals: sentLikeProposalsIncompleteDispatch.length > 0
        ? 'Reparar per la ruta canonica /api/admin/proposals/:id/send, no per patch manual.'
        : 'Cap Proposal SENT/VIEWED sense pdfUrl/pdfKey/sentAt a la mostra.',
      sentLikeProposalsMissingQuoteSnapshot: sentLikeProposalsMissingQuoteSnapshot.length > 0
        ? 'Proposal enviat amb PDF però sense quoteSnapshot canonic: no reenvii ni patchis; reconstruir o regenerar pel servei canonic perquè preview/desat/email tornin a la mateixa font.'
        : 'Cap Proposal SENT/VIEWED amb PDF sense quoteSnapshot canonic a la mostra.',
      proposalEmailTraceMismatches: proposalEmailTraceMismatches.length > 0
        ? 'Emails proposal-send antics o incoherents sense orbitaKind=proposal: no reenvii; si cal, reconstrueix la traça des d adminLog/emailSendId i deixa el pressupost nou sempre pel dispatch canonic.'
        : 'Cap EmailSend proposal-send sense traça orbitaKind=proposal a la mostra.',
      proposalEmailDocumentMismatches: proposalEmailDocumentMismatches.length > 0
        ? 'EmailSend proposal-send amb link/PDF divergent: no reenvii; compara EmailSend, Proposal i adminLog, i repara pel dispatch canonic perquè el client obri el mateix PDF que el Proposal.'
        : 'Cap EmailSend proposal-send amb link/PDF divergent del Proposal a la mostra.',
      acceptedProposalsWithoutBooking: acceptedProposalsWithoutBooking.length > 0
        ? 'Crear reserva per la ruta canonica /admin/bookings/new?proposalId=... abans de contracte; no saltar el booking.'
        : 'Cap Proposal ACCEPTED sense bookingId a la mostra.',
      advancedContractsMissingArtifact: advancedContractsMissingArtifact.length > 0
        ? 'Reparar pel servei de contracte: reenviar/regenerar contracte o tornar-lo a estat coherent; no marcar SENT/SIGNED sense PDF contractual.'
        : 'Cap contracte SENT/SIGNED sense contractPdfUrl/contractPdfKey a la mostra.',
      activeInvoicesMissingPdf: activeInvoicesMissingPdf.length > 0
        ? 'Reparar pel servei de factura perquè generi pdfUrl/pdfKey; no substituir factura per pressupost al portal.'
        : 'Cap factura activa sense pdfUrl/pdfKey a la mostra.',
      advancedDeliveryNotesMissingPdf: advancedDeliveryNotesMissingPdf.length > 0
        ? 'Reparar pel servei d albara amb force PDF si esta DELIVERED/SIGNED; el portal no ha d amagar documents finals.'
        : 'Cap albara DELIVERED/SIGNED sense pdfUrl/pdfKey a la mostra.',
      completedBookingsPostEventNotStarted: completedBookingsPostEventNotStarted.length > 0
        ? 'Arrencar post-event pel playbook/hub: email d agraiment, informe intern o enquesta; no deixar booking COMPLETED sense volant.'
        : 'Cap booking COMPLETED recent amb post-event sense arrencar a la mostra.',
      postEventEmailFlagWithoutSentAt: postEventEmailFlagWithoutSentAt.length > 0
        ? 'Reparar pel servei de dispatch post-event: el flag enviat no pot existir sense timestamp reconstruible.'
        : 'Cap booking amb postEventEmailSent=true i postEventEmailSentAt nul a la mostra.',
      adminTestArtifacts: [
        adminTestArtifactCustomers,
        adminTestArtifactLeads,
        adminTestArtifactBookings,
        adminTestArtifactDossiers,
        adminTestArtifactProposals,
        adminTestArtifactEmailSends,
        adminTestArtifactLeadDocuments,
        adminTestArtifactLeadNotes,
        adminTestArtifactLeadActivities,
      ].some((rows) => rows.length > 0)
        ? 'Handoff a Claude: revisar els findings adminTestArtifact* amb IDs/samples i executar una neteja canonica acotada; Codex no ha fet cap delete ni migracio en aquest tall.'
        : 'Cap artefacte de prova Zenit en entitats principals, documents o comunicacions comercials de la mostra.',
      customQuotes: retiredCustomQuotes.length > 0
        ? 'custom_quotes es lectura historica retirada: no crear/update/delete fora de /admin/presupuestos.'
        : 'Cap custom_quote a la mostra.',
    },
  };

  console.log(serialize(report));
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
