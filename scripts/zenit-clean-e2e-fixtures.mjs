#!/usr/bin/env node
// Neteja acotada de fixtures de prova Zenit (leads/customers marcats a adminTestArtifacts.json
// i tot el seu rastre). Dry-run per defecte. Font unica de marcadors: lib/constants/adminTestArtifacts.json
// (la mateixa que fa servir zenit-db-audit.mjs — no duplicar el criteri aqui).
import fs from 'node:fs';
import path from 'node:path';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;

const args = new Set(process.argv.slice(2));
const MAX_PREVIEW_ROWS = 200;
const ADMIN_TEST_ARTIFACT_CONFIG_PATH = path.join(process.cwd(), 'lib', 'constants', 'adminTestArtifacts.json');

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

// Mateixa logica que adminTestArtifactWhere() a zenit-db-audit.mjs — una sola font de criteri.
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
  return { OR: adminTestArtifactFieldFilters(fields) };
}

function printHelp() {
  console.log([
    'Us:',
    '  pnpm run zenit:clean:e2e-fixtures',
    '  pnpm run zenit:clean:e2e-fixtures -- --apply',
    '',
    'Per defecte es DRY-RUN: llista leads/customers que coincideixen amb els marcadors',
    'de lib/constants/adminTestArtifacts.json (mateix criteri que zenit:db:audit) i tot',
    'el rastre relacionat (dossiers, proposals, bookings i els seus fills, tasks,',
    'documents, emails, portal access, invoices, delivery notes, consent/data requests).',
    'Amb --apply ho elimina tot dins una unica transaccio.',
  ].join('\n'));
}

function serialize(value) {
  return JSON.stringify(value, (_key, inner) => {
    if (inner instanceof Date) return inner.toISOString();
    if (typeof inner === 'bigint') return inner.toString();
    return inner;
  }, 2);
}

if (args.has('--help') || args.has('-h')) {
  printHelp();
  process.exit(0);
}

const apply = args.has('--apply');

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function collect(db) {
  const customers = await db.customer.findMany({
    where: adminTestArtifactWhere(['name', 'email', 'phone']),
    select: { id: true, name: true, customerNumber: true, createdAt: true },
  });
  const leads = await db.lead.findMany({
    where: adminTestArtifactWhere(['name', 'email', 'phone', 'eventLocation', 'message']),
    select: { id: true, name: true, customerId: true, createdAt: true },
  });

  const customerIds = customers.map((c) => c.id);
  const leadIds = leads.map((l) => l.id);

  const bookings = await db.booking.findMany({
    where: { OR: [{ leadId: { in: leadIds } }, { customerId: { in: customerIds } }] },
    select: { id: true, reference: true, clientName: true },
  });
  const bookingIds = bookings.map((b) => b.id);

  const leadOrCustomerOrBooking = {
    OR: [
      { leadId: { in: leadIds } },
      { customerId: { in: customerIds } },
      { bookingId: { in: bookingIds } },
    ],
  };
  const leadOrCustomer = {
    OR: [{ leadId: { in: leadIds } }, { customerId: { in: customerIds } }],
  };

  const [
    proposals,
    dossiers,
    leadNotes,
    leadActivities,
    leadDocuments,
    leadServiceLines,
    collaboratorPayments,
    tasks,
    emailSends,
    inventoryUsages,
    questionnaireResponses,
    clientPortalAccesses,
    bookingServiceLines,
    invoices,
    deliveryNotes,
    bookingExtras,
    bookingInventory,
    availability,
    postEventReports,
    clientSurveys,
    clientFeedbacks,
    liveNotifications,
    stripeWebhookEvents,
    bookingGalleryPhotos,
    socialPosts,
    customerContacts,
    customerActivities,
    customerTestimonials,
    customerDiscountCodes,
    consentRecords,
    dataRequests,
  ] = await Promise.all([
    db.proposal.findMany({ where: leadOrCustomerOrBooking, select: { id: true, reference: true } }),
    db.dossier.findMany({ where: { leadId: { in: leadIds } }, select: { id: true, nom: true } }),
    db.leadNote.findMany({ where: { leadId: { in: leadIds } }, select: { id: true } }),
    db.leadActivity.findMany({ where: { leadId: { in: leadIds } }, select: { id: true } }),
    db.leadDocument.findMany({ where: { leadId: { in: leadIds } }, select: { id: true } }),
    db.leadServiceLine.findMany({ where: { leadId: { in: leadIds } }, select: { id: true } }),
    db.collaboratorPayment.findMany({ where: { OR: [{ leadId: { in: leadIds } }, { bookingId: { in: bookingIds } }] }, select: { id: true } }),
    db.task.findMany({ where: leadOrCustomerOrBooking, select: { id: true } }),
    db.emailSend.findMany({ where: leadOrCustomer, select: { id: true } }),
    db.inventoryUsage.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.questionnaireResponse.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.clientPortalAccess.findMany({ where: { OR: [{ bookingId: { in: bookingIds } }, { customerId: { in: customerIds } }] }, select: { id: true } }),
    db.bookingServiceLine.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.invoice.findMany({ where: { OR: [{ bookingId: { in: bookingIds } }, { customerId: { in: customerIds } }] }, select: { id: true } }),
    db.deliveryNote.findMany({ where: { OR: [{ bookingId: { in: bookingIds } }, { customerId: { in: customerIds } }] }, select: { id: true } }),
    db.bookingExtra.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.bookingInventory.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.availability.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.postEventReport.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.clientSurvey.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.clientFeedback.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.liveNotification.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.stripeWebhookEvent.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.bookingGalleryPhoto.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.socialPost.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } }),
    db.customerContact.findMany({ where: { customerId: { in: customerIds } }, select: { id: true } }),
    db.customerActivity.findMany({ where: { customerId: { in: customerIds } }, select: { id: true } }),
    db.customerTestimonial.findMany({ where: { customerId: { in: customerIds } }, select: { id: true } }),
    db.customerDiscountCode.findMany({ where: { customerId: { in: customerIds } }, select: { id: true } }),
    db.consentRecord.findMany({ where: { customerId: { in: customerIds } }, select: { id: true } }),
    db.dataRequest.findMany({ where: { customerId: { in: customerIds } }, select: { id: true } }),
  ]);

  return {
    customers, leads, bookings,
    proposals, dossiers, leadNotes, leadActivities, leadDocuments, leadServiceLines,
    collaboratorPayments, tasks, emailSends, inventoryUsages, questionnaireResponses,
    clientPortalAccesses, bookingServiceLines, invoices, deliveryNotes, bookingExtras,
    bookingInventory, availability, postEventReports, clientSurveys, clientFeedbacks,
    liveNotifications, stripeWebhookEvents, bookingGalleryPhotos, socialPosts,
    customerContacts, customerActivities, customerTestimonials, customerDiscountCodes,
    consentRecords, dataRequests,
  };
}

function summary(found) {
  const counts = {};
  for (const [key, rows] of Object.entries(found)) {
    counts[key] = rows.length;
  }
  return counts;
}

async function main() {
  const found = await collect(prisma);
  const counts = summary(found);
  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);

  if (!apply) {
    console.log(serialize({
      mode: 'DRY-RUN',
      markers: adminTestArtifactConfig,
      totalRows,
      counts,
      preview: {
        customers: found.customers.slice(0, MAX_PREVIEW_ROWS),
        leads: found.leads.slice(0, MAX_PREVIEW_ROWS),
        bookings: found.bookings.slice(0, MAX_PREVIEW_ROWS),
      },
      applied: false,
      message: "DRY-RUN: no s'ha eliminat res. Reexecuta amb -- --apply nomes si aquesta llista es correcta.",
    }));
    return;
  }

  const idsOf = (rows) => rows.map((r) => r.id);

  const result = await prisma.$transaction(async (tx) => {
    const deleted = {};
    // Fills de Booking (nivell mes profund) primer.
    deleted.inventoryUsages = await tx.inventoryUsage.deleteMany({ where: { id: { in: idsOf(found.inventoryUsages) } } });
    deleted.questionnaireResponses = await tx.questionnaireResponse.deleteMany({ where: { id: { in: idsOf(found.questionnaireResponses) } } });
    deleted.clientPortalAccesses = await tx.clientPortalAccess.deleteMany({ where: { id: { in: idsOf(found.clientPortalAccesses) } } });
    deleted.bookingServiceLines = await tx.bookingServiceLine.deleteMany({ where: { id: { in: idsOf(found.bookingServiceLines) } } });
    deleted.invoices = await tx.invoice.deleteMany({ where: { id: { in: idsOf(found.invoices) } } });
    deleted.deliveryNotes = await tx.deliveryNote.deleteMany({ where: { id: { in: idsOf(found.deliveryNotes) } } });
    deleted.bookingExtras = await tx.bookingExtra.deleteMany({ where: { id: { in: idsOf(found.bookingExtras) } } });
    deleted.bookingInventory = await tx.bookingInventory.deleteMany({ where: { id: { in: idsOf(found.bookingInventory) } } });
    deleted.availability = await tx.availability.deleteMany({ where: { id: { in: idsOf(found.availability) } } });
    deleted.postEventReports = await tx.postEventReport.deleteMany({ where: { id: { in: idsOf(found.postEventReports) } } });
    deleted.clientSurveys = await tx.clientSurvey.deleteMany({ where: { id: { in: idsOf(found.clientSurveys) } } });
    deleted.clientFeedbacks = await tx.clientFeedback.deleteMany({ where: { id: { in: idsOf(found.clientFeedbacks) } } });
    deleted.liveNotifications = await tx.liveNotification.deleteMany({ where: { id: { in: idsOf(found.liveNotifications) } } });
    deleted.stripeWebhookEvents = await tx.stripeWebhookEvent.deleteMany({ where: { id: { in: idsOf(found.stripeWebhookEvents) } } });
    deleted.bookingGalleryPhotos = await tx.bookingGalleryPhoto.deleteMany({ where: { id: { in: idsOf(found.bookingGalleryPhotos) } } });
    deleted.socialPosts = await tx.socialPost.deleteMany({ where: { id: { in: idsOf(found.socialPosts) } } });

    // Fills directes de Lead/Customer.
    deleted.proposals = await tx.proposal.deleteMany({ where: { id: { in: idsOf(found.proposals) } } });
    deleted.dossiers = await tx.dossier.deleteMany({ where: { id: { in: idsOf(found.dossiers) } } });
    deleted.leadNotes = await tx.leadNote.deleteMany({ where: { id: { in: idsOf(found.leadNotes) } } });
    deleted.leadActivities = await tx.leadActivity.deleteMany({ where: { id: { in: idsOf(found.leadActivities) } } });
    deleted.leadDocuments = await tx.leadDocument.deleteMany({ where: { id: { in: idsOf(found.leadDocuments) } } });
    deleted.leadServiceLines = await tx.leadServiceLine.deleteMany({ where: { id: { in: idsOf(found.leadServiceLines) } } });
    deleted.collaboratorPayments = await tx.collaboratorPayment.deleteMany({ where: { id: { in: idsOf(found.collaboratorPayments) } } });
    deleted.tasks = await tx.task.deleteMany({ where: { id: { in: idsOf(found.tasks) } } });
    deleted.emailSends = await tx.emailSend.deleteMany({ where: { id: { in: idsOf(found.emailSends) } } });
    deleted.customerContacts = await tx.customerContact.deleteMany({ where: { id: { in: idsOf(found.customerContacts) } } });
    deleted.customerActivities = await tx.customerActivity.deleteMany({ where: { id: { in: idsOf(found.customerActivities) } } });
    deleted.customerTestimonials = await tx.customerTestimonial.deleteMany({ where: { id: { in: idsOf(found.customerTestimonials) } } });
    deleted.customerDiscountCodes = await tx.customerDiscountCode.deleteMany({ where: { id: { in: idsOf(found.customerDiscountCodes) } } });
    deleted.consentRecords = await tx.consentRecord.deleteMany({ where: { id: { in: idsOf(found.consentRecords) } } });
    deleted.dataRequests = await tx.dataRequest.deleteMany({ where: { id: { in: idsOf(found.dataRequests) } } });

    // Bookings, despres leads, despres customers.
    deleted.bookings = await tx.booking.deleteMany({ where: { id: { in: idsOf(found.bookings) } } });
    deleted.leads = await tx.lead.deleteMany({ where: { id: { in: idsOf(found.leads) } } });
    deleted.customers = await tx.customer.deleteMany({ where: { id: { in: idsOf(found.customers) } } });

    return deleted;
  });

  const deletedCounts = Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.count]));
  const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0);

  console.log(serialize({
    mode: 'APPLY',
    markers: adminTestArtifactConfig,
    totalDeleted,
    deletedCounts,
    applied: true,
  }));
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
