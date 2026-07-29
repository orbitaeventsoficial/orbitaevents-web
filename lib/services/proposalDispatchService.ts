import { Prisma } from '@prisma/client';
import { getPackById, getPacksByService, type ExtraDefinition, type PackDefinition, type ServiceSlug } from '@/app/config/packs-config';
import { generateQuotePDF, type QuoteData } from '@/lib/services/quotePdfService';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { escapeHtml } from '@/lib/utils/sanitize';
import { uploadFile } from '@/lib/storage';
import { getAppBaseUrl } from '@/lib/site';
import { mapLeadEventType, normalizeQuoteLocale, parseDateOrNull } from '@/lib/services/quotes/quoteParsing';
import { ensureQuoteFollowUpTask } from '@/lib/services/tasks/quoteFollowUp';
import { recordCustomerProposalSent } from '@/lib/services/customerActivityService';
import { DOCUMENT_ADMIN_LOG_ACTIONS, recordDocumentAdminLog } from '@/lib/services/documentAuditTrailService';
import { recordEmailSend, updateEmailSendResult, wrapLinksForTracking } from '@/lib/services/emailTrackingService';
import { isSentLikeProposalStatus } from '@/lib/proposals/status';
import {
  PROPOSAL_EMAIL_COPY,
  PROPOSAL_EMAIL_TEMPLATE_KEY,
  buildProposalEmailSubject,
  normalizeProposalEmailLocale,
} from '@/lib/constants/proposalEmail';

type ProposalSnapshot = {
  customer?: { name?: string; phone?: string };
  event?: { date?: string | Date | null; schedule?: string; location?: string; guests?: number | string | null };
  eventType?: string;
  whyChooseUs?: string;
  packId?: string;
};

type JsonRecord = Record<string, unknown>;
type QuoteDocumentSnapshot = ReturnType<typeof buildQuoteDocumentSnapshot>;

const DEFAULT_SERVICE_SLUG: ServiceSlug = 'fiestas';

function serviceSlugFrom(value: unknown): ServiceSlug {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'bodas' || raw === 'wedding') return 'bodas';
  if (raw === 'empresas' || raw === 'corporate') return 'empresas';
  if (raw === 'animacion' || raw === 'animació') return 'animacion';
  if (raw === 'discomovil' || raw === 'discomòbil' || raw === 'dj') return 'discomovil';
  if (raw === 'fiestas' || raw === 'birthday' || raw === 'private_party') return 'fiestas';
  return DEFAULT_SERVICE_SLUG;
}

function safeFileSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'proposal';
}

type QuoteSnapshotProposal = {
  id: string;
  reference: string;
  customerId: string | null;
  leadId: string | null;
  bookingId: string | null;
  status: string;
  locale: string;
  currency: string;
  validityDays: number;
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  snapshot: unknown;
  customer: { id: string; name: string | null; email: string | null } | null;
};

type UploadedProposalPdf = {
  path: string;
  publicUrl: string;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function textFrom(record: JsonRecord, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function numberFrom(record: JsonRecord, key: string, fallback = 0): number {
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
}

function extrasArray(value: unknown): Array<{ id: string | null; name: string; description: string | null; price: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asRecord(item);
      const name = textFrom(row, 'name');
      if (!name) return null;
      return {
        id: textFrom(row, 'id') || null,
        name,
        description: textFrom(row, 'description') || null,
        price: numberFrom(row, 'price'),
      };
    })
    .filter((item): item is { id: string | null; name: string; description: string | null; price: number } => !!item);
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function buildQuoteDocumentSnapshot(proposal: QuoteSnapshotProposal, createdAt: Date = new Date()) {
  const snapshot = asRecord(proposal.snapshot);
  const customer = asRecord(snapshot.customer);
  const event = asRecord(snapshot.event);
  const pricing = asRecord(snapshot.pricing);
  const extras = asRecord(snapshot.extras);
  const brand = asRecord(snapshot.brand);
  const createdAtIso = createdAt.toISOString();

  return {
    version: 1,
    createdAt: createdAtIso,
    source: 'admin_proposal_send',
    documentType: 'PROPOSAL',
    proposalId: proposal.id,
    reference: proposal.reference,
    statusAtFreeze: proposal.status,
    locale: proposal.locale,
    currency: proposal.currency,
    validityDays: proposal.validityDays,
    customer: {
      customerId: proposal.customerId,
      name: textFrom(customer, 'name') || proposal.customer?.name || 'Client',
      email: proposal.customer?.email || textFrom(customer, 'email') || null,
      phone: textFrom(customer, 'phone') || null,
      contact: textFrom(customer, 'contact') || null,
    },
    event: {
      eventType: textFrom(snapshot, 'eventType'),
      date: event.date ?? null,
      schedule: textFrom(event, 'schedule') || null,
      location: textFrom(event, 'location') || null,
      guests: numberFrom(event, 'guests'),
    },
    pack: {
      packId: textFrom(snapshot, 'packId') || null,
      name: textFrom(snapshot, 'packName') || 'Pack',
      basePrice: numberFrom(snapshot, 'basePrice'),
      durationHours: numberFrom(snapshot, 'durationHours'),
      features: stringArray(snapshot.features),
    },
    extras: {
      preset: extrasArray(extras.preset),
      custom: extrasArray(extras.custom),
      total: numberFrom(pricing, 'extrasPrice'),
    },
    pricing: {
      subtotal: proposal.subtotal,
      discount: proposal.discount,
      vatRate: proposal.vatRate,
      vatAmount: proposal.vatAmount,
      total: proposal.total,
      discountReason: textFrom(pricing, 'discountReason') || null,
      travelKm: numberFrom(pricing, 'travelKm'),
      travelCharge: numberFrom(pricing, 'travelCharge'),
    },
    conditions: stringArray(snapshot.conditions),
    whyChooseUs: textFrom(snapshot, 'whyChooseUs') || null,
    brand: {
      name: textFrom(brand, 'brandName') || null,
      website: textFrom(brand, 'brandWebsite') || null,
      email: textFrom(brand, 'brandEmail') || null,
      phone: textFrom(brand, 'brandPhone') || null,
      tagline: textFrom(brand, 'brandTagline') || null,
    },
    trace: {
      frozenFrom: 'Proposal.snapshot+Proposal.fields',
      safety: 'QUOTE_SNAPSHOT_V1',
      sentAt: createdAtIso,
      leadId: proposal.leadId,
      bookingId: proposal.bookingId,
    },
  };
}

function mergeQuoteDocumentSnapshot(snapshot: unknown, quoteSnapshot: ReturnType<typeof buildQuoteDocumentSnapshot>) {
  return toJsonValue({
    ...asRecord(snapshot),
    quoteSnapshot,
  });
}

function buildSnapshotPack(quoteSnapshot: QuoteDocumentSnapshot): PackDefinition {
  const event = asRecord(quoteSnapshot.event);
  const pack = asRecord(quoteSnapshot.pack);
  const service = serviceSlugFrom(event.eventType);
  const packId = textFrom(pack, 'packId');
  const catalogPack = packId ? getPackById(packId) : undefined;
  const fallbackPack = catalogPack || getPacksByService(service)[0] || getPacksByService(DEFAULT_SERVICE_SLUG)[0];
  const basePrice = numberFrom(pack, 'basePrice', fallbackPack?.priceValue ?? 0);
  const durationHours = numberFrom(pack, 'durationHours', fallbackPack?.durationHours ?? 0);
  const features = stringArray(pack.features);

  return {
    ...(fallbackPack || {
      id: packId || 'proposal-snapshot-pack',
      service,
      slug: packId || 'proposal-snapshot-pack',
      name: textFrom(pack, 'name') || 'Pack',
      tagline: '',
      price: `${basePrice}€`,
      priceValue: basePrice,
      features,
      duration: `${durationHours}h`,
      durationHours,
    }),
    id: packId || fallbackPack?.id || 'proposal-snapshot-pack',
    service,
    slug: packId || fallbackPack?.slug || 'proposal-snapshot-pack',
    name: textFrom(pack, 'name') || fallbackPack?.name || 'Pack',
    price: `${basePrice}€`,
    priceValue: basePrice,
    features: features.length > 0 ? features : fallbackPack?.features || [],
    duration: `${durationHours}h`,
    durationHours,
  };
}

function buildSnapshotExtrasCatalog(quoteSnapshot: QuoteDocumentSnapshot): ExtraDefinition[] {
  const extras = asRecord(quoteSnapshot.extras);
  const rows = [
    ...extrasArray(extras.preset),
    ...extrasArray(extras.custom),
  ];

  return rows.map((extra, index) => ({
    id: extra.id || `proposal-extra-${index + 1}`,
    name: extra.name,
    description: extra.description || 'Extra',
    price: extra.price,
    icon: '*',
    category: 'other',
  }));
}

function buildQuotePdfDataFromSnapshot(quoteSnapshot: QuoteDocumentSnapshot): QuoteData {
  const customer = asRecord(quoteSnapshot.customer);
  const event = asRecord(quoteSnapshot.event);
  const pricing = asRecord(quoteSnapshot.pricing);
  const pack = asRecord(quoteSnapshot.pack);
  const extrasCatalog = buildSnapshotExtrasCatalog(quoteSnapshot);
  const vatAmount = numberFrom(pricing, 'vatAmount');
  const subtotal = numberFrom(pricing, 'subtotal');
  const discount = numberFrom(pricing, 'discount');

  return {
    reference: quoteSnapshot.reference,
    eventType: serviceSlugFrom(event.eventType),
    pack: buildSnapshotPack(quoteSnapshot),
    date: String(event.date || ''),
    issueDate: quoteSnapshot.createdAt,
    eventSchedule: textFrom(event, 'schedule') || undefined,
    eventLocation: textFrom(event, 'location') || undefined,
    guests: numberFrom(event, 'guests'),
    extras: extrasCatalog.map((extra) => extra.name),
    extrasCatalog,
    basePrice: numberFrom(pack, 'basePrice'),
    extrasPrice: numberFrom(asRecord(quoteSnapshot.extras), 'total'),
    travelCharge: numberFrom(pricing, 'travelCharge'),
    travelKm: numberFrom(pricing, 'travelKm'),
    discount,
    discountReason: textFrom(pricing, 'discountReason'),
    taxableBase: Math.max(0, subtotal - discount),
    vatRate: numberFrom(pricing, 'vatRate'),
    vatAmount,
    total: numberFrom(pricing, 'total'),
    clientName: textFrom(customer, 'name'),
    clientEmail: textFrom(customer, 'email'),
    clientPhone: textFrom(customer, 'phone') || undefined,
    clientContact: textFrom(customer, 'contact') || undefined,
    validityDays: Number.isFinite(Number(quoteSnapshot.validityDays)) ? Number(quoteSnapshot.validityDays) : 15,
    conditions: stringArray(quoteSnapshot.conditions),
    whyChooseUs: textFrom(asRecord(quoteSnapshot), 'whyChooseUs') || undefined,
  };
}

async function renderProposalPdfBuffer(quoteSnapshot: QuoteDocumentSnapshot): Promise<Buffer> {
  const locale = normalizeProposalEmailLocale(quoteSnapshot.locale);
  const doc = await generateQuotePDF(buildQuotePdfDataFromSnapshot(quoteSnapshot), locale);
  return Buffer.from(doc.output('arraybuffer'));
}

function hasStoredPdfArtifact(value: {
  pdfUrl?: string | null;
  pdfKey?: string | null;
}): boolean {
  return Boolean(value.pdfUrl?.trim() && value.pdfKey?.trim());
}

function isValidUploadedProposalPdf(value: UploadedProposalPdf): boolean {
  return Boolean(value.publicUrl?.trim() && value.path?.trim());
}

async function uploadProposalPdfArtifact(
  proposal: { id: string; reference: string },
  quoteSnapshot: QuoteDocumentSnapshot,
): Promise<
  | { ok: true; pdfBuffer: Buffer; uploadedPdf: UploadedProposalPdf }
  | { ok: false; status: number; body: { ok: false; error: string } }
> {
  const pdfBuffer = await renderProposalPdfBuffer(quoteSnapshot);
  const pdfKey = `proposals/${proposal.id}/${safeFileSegment(proposal.reference)}.pdf`;
  const uploadedPdf = await uploadFile(pdfKey, pdfBuffer);

  if (!isValidUploadedProposalPdf(uploadedPdf)) {
    return {
      ok: false,
      status: 500,
      body: {
        ok: false,
        error: 'No s’ha pogut arxivar el PDF del pressupost. No s’ha enviat cap email.',
      },
    };
  }

  return { ok: true, pdfBuffer, uploadedPdf };
}

function buildProposalEmailHtml(input: {
  customerName: string;
  reference: string;
  pdfUrl: string;
  locale: ReturnType<typeof normalizeProposalEmailLocale>;
}) {
  const copy = PROPOSAL_EMAIL_COPY[input.locale];
  const name = input.customerName.trim() || copy.greetingFallback;
  const greeting = input.customerName.trim()
    ? `${copy.greetingFallback} ${escapeHtml(name)},`
    : `${copy.greetingFallback},`;

  return [
    `<p>${greeting}</p>`,
    `<p>${escapeHtml(copy.intro)}</p>`,
    `<p>${escapeHtml(copy.attached)}</p>`,
    `<p>${escapeHtml(copy.review)}</p>`,
    `<p>${escapeHtml(copy.close)}</p>`,
    `<p style="font-size:12px;color:#64748b;">${escapeHtml(copy.subjectPrefix)} ${escapeHtml(input.reference)} · PDF: ${escapeHtml(input.pdfUrl)}</p>`,
  ].join('');
}

async function sendCanonicalProposalEmail(input: {
  proposalId: string;
  reference: string;
  leadId: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  locale: string;
  pdfUrl: string;
  pdfBuffer: Buffer;
}) {
  const locale = normalizeProposalEmailLocale(input.locale);
  const subject = buildProposalEmailSubject(input.reference, locale);
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
  const publicPdfUrl = input.pdfUrl.startsWith('http') ? input.pdfUrl : `${baseUrl}${input.pdfUrl}`;
  const bodyHtml = buildProposalEmailHtml({
    customerName: input.customerName,
    reference: input.reference,
    pdfUrl: publicPdfUrl,
    locale,
  });
  const trackingRecord = await recordEmailSend({
    templateKey: PROPOSAL_EMAIL_TEMPLATE_KEY,
    to: input.customerEmail,
    subject,
    leadId: input.leadId,
    customerId: input.customerId,
    locale,
    htmlBody: bodyHtml,
    orbitaKind: 'proposal',
    orbitaId: input.proposalId,
    orbitaOrigin: 'admin-proposal-send',
  });
  const trackedHtml = `${wrapLinksForTracking(bodyHtml, trackingRecord.trackingToken, baseUrl)}<img src="${baseUrl}/api/tracking/open/${trackingRecord.trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  const sendResult = await sendEmail({
    to: input.customerEmail,
    subject,
    html: trackedHtml,
    brandingStyle: 'soft',
    attachments: [{
      filename: `pressupost-${safeFileSegment(input.reference)}.pdf`,
      content: input.pdfBuffer,
      contentType: 'application/pdf',
    }],
    orbita: { kind: 'proposal', id: input.proposalId, origin: 'admin-proposal-send' },
  });

  await updateEmailSendResult(trackingRecord.id, {
    smtpAccepted: sendResult.smtp.accepted,
    smtpRejected: sendResult.smtp.rejected,
    smtpResponse: sendResult.smtp.response,
    smtpMessageId: sendResult.smtp.messageId,
    imapAppendOk: sendResult.imapSent.attempted ? sendResult.imapSent.ok : null,
    imapSentFolder: sendResult.imapSent.folder,
    imapSentUid: sendResult.imapSent.uid ?? null,
    imapError: sendResult.imapSent.error ?? null,
  }).catch(() => undefined);

  return { subject, emailSendId: trackingRecord.id };
}

export async function sendAdminProposal(id: string) {
  const existing = await prisma.proposal.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!existing) {
    return { status: 404, body: { ok: false, error: 'Pressupost no trobat' } };
  }

  const customer = existing.customer;
  const customerId = existing.customerId;
  if (!customer || !customerId) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Aquest pressupost no té client assignat. Vincula un client abans d\'enviar-lo.',
      },
    };
  }

  if (isSentLikeProposalStatus(existing.status) && hasStoredPdfArtifact(existing) && !existing.sentAt) {
    const repairedSentAt = existing.updatedAt ?? existing.createdAt ?? new Date();
    const repairBasis = existing.updatedAt
      ? 'proposal.updatedAt'
      : existing.createdAt
        ? 'proposal.createdAt'
        : 'runtime.now';
    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        sentAt: repairedSentAt,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true } },
      },
    });

    await recordDocumentAdminLog({
      action: DOCUMENT_ADMIN_LOG_ACTIONS.PROPOSAL_PDF_REPAIRED,
      entity: 'proposal',
      entityId: proposal.id,
      details: {
        documentType: 'PROPOSAL',
        source: 'admin_proposal_sent_at_repair',
        reason: 'sent_like_pdf_artifact_missing_sentAt',
        reference: proposal.reference,
        proposalId: proposal.id,
        customerId,
        leadId: proposal.leadId || proposal.lead?.id || existing.leadId,
        bookingId: proposal.bookingId,
        status: proposal.status,
        sentAt: repairedSentAt.toISOString(),
        repairBasis,
        pdfUrl: proposal.pdfUrl || existing.pdfUrl,
        pdfKey: proposal.pdfKey || existing.pdfKey,
      },
    });

    return { status: 200, body: { ok: true, repaired: true, proposal } };
  }

  if (!customer.email) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Aquest pressupost no té email de client. Afegeix un email abans d\'enviar-lo.',
      },
    };
  }

  if (isSentLikeProposalStatus(existing.status) && hasStoredPdfArtifact(existing)) {
    return {
      status: 409,
      body: {
        ok: false,
        error: 'Aquest pressupost ja està enviat i té el PDF arxivat. No es reenviarà des d’aquesta acció.',
      },
    };
  }

  if (existing.status !== 'DRAFT' && !isSentLikeProposalStatus(existing.status)) {
    return {
      status: 409,
      body: {
        ok: false,
        error: 'Només es poden enviar pressupostos en esborrany. Reobre o duplica la proposta abans d’enviar-la.',
      },
    };
  }

  let ensuredLeadId = existing.leadId || null;

  if (!ensuredLeadId) {
    const snapshot = ((existing.snapshot as ProposalSnapshot | null) || {}) satisfies ProposalSnapshot;
    const snapshotCustomer = snapshot.customer || {};
    const snapshotEvent = snapshot.event || {};

    const reusableLead = await prisma.lead.findFirst({
      where: {
        OR: [{ customerId: customerId }, { email: customer.email }],
        status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    if (reusableLead) {
      ensuredLeadId = reusableLead.id;
    } else {
      const createdLead = await prisma.lead.create({
        data: {
          customerId: customerId,
          name: customer.name || String(snapshotCustomer.name || 'Client'),
          email: customer.email,
          phone: snapshotCustomer.phone ? String(snapshotCustomer.phone) : null,
          eventType: mapLeadEventType(snapshot.eventType),
          eventDate: parseDateOrNull(snapshotEvent.date),
          eventSchedule: snapshotEvent.schedule ? String(snapshotEvent.schedule) : null,
          eventLocation: snapshotEvent.location ? String(snapshotEvent.location) : null,
          guestCount: Number.isFinite(Number(snapshotEvent.guests)) ? Math.max(0, Math.round(Number(snapshotEvent.guests))) : null,
          budget: Number.isFinite(Number(existing.total)) ? String(Number(existing.total).toFixed(2)) : null,
          message: snapshot.whyChooseUs ? String(snapshot.whyChooseUs) : null,
          interestedPackId: snapshot.packId ? String(snapshot.packId) : null,
          interestedExtras: [],
          source: 'OTHER',
          status: 'QUOTE_SENT',
          preferredLocale: normalizeQuoteLocale(existing.locale),
        },
        select: { id: true },
      });
      ensuredLeadId = createdLead.id;
    }
  }

  const sentAt = new Date();
  const effectiveSentAt = isSentLikeProposalStatus(existing.status) && existing.sentAt ? existing.sentAt : sentAt;
  const quoteSnapshot = buildQuoteDocumentSnapshot(
    {
      id: existing.id,
      reference: existing.reference,
      customerId: existing.customerId,
      leadId: ensuredLeadId,
      bookingId: existing.bookingId,
      status: 'SENT',
      locale: existing.locale,
      currency: existing.currency,
      validityDays: existing.validityDays,
      subtotal: existing.subtotal,
      discount: existing.discount,
      vatRate: existing.vatRate,
      vatAmount: existing.vatAmount,
      total: existing.total,
      snapshot: existing.snapshot,
      customer: existing.customer,
    },
    effectiveSentAt,
  );

  const pdfArtifact = await uploadProposalPdfArtifact(existing, quoteSnapshot);
  if (!pdfArtifact.ok) {
    return pdfArtifact;
  }
  const { pdfBuffer, uploadedPdf } = pdfArtifact;

  if (isSentLikeProposalStatus(existing.status) && !hasStoredPdfArtifact(existing)) {
    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        leadId: ensuredLeadId,
        snapshot: mergeQuoteDocumentSnapshot(existing.snapshot, quoteSnapshot),
        pdfUrl: uploadedPdf.publicUrl,
        pdfKey: uploadedPdf.path,
        sentAt: existing.sentAt ?? sentAt,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true } },
      },
    });

    await recordDocumentAdminLog({
      action: DOCUMENT_ADMIN_LOG_ACTIONS.PROPOSAL_PDF_REPAIRED,
      entity: 'proposal',
      entityId: proposal.id,
      details: {
        documentType: 'PROPOSAL',
        source: 'admin_proposal_pdf_repair',
        reference: proposal.reference,
        proposalId: proposal.id,
        customerId,
        leadId: proposal.leadId || proposal.lead?.id || ensuredLeadId,
        bookingId: proposal.bookingId,
        pdfUrl: uploadedPdf.publicUrl,
        pdfKey: uploadedPdf.path,
      },
    });

    return { status: 200, body: { ok: true, repaired: true, proposal } };
  }

  const emailDispatch = await sendCanonicalProposalEmail({
    proposalId: existing.id,
    reference: existing.reference,
    leadId: ensuredLeadId,
    customerId,
    customerName: customer.name || quoteSnapshot.customer.name || 'Client',
    customerEmail: customer.email,
    locale: existing.locale,
    pdfUrl: uploadedPdf.publicUrl,
    pdfBuffer,
  });

  const proposal = await prisma.proposal.update({
    where: { id },
    data: {
      leadId: ensuredLeadId,
      status: 'SENT',
      sentAt,
      snapshot: mergeQuoteDocumentSnapshot(existing.snapshot, quoteSnapshot),
      pdfUrl: uploadedPdf.publicUrl,
      pdfKey: uploadedPdf.path,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true } },
    },
  });

  await recordCustomerProposalSent({
    customerId,
    proposalId: proposal.id,
    reference: proposal.reference,
    total: proposal.total,
  });

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.PROPOSAL_SENT,
    entity: 'proposal',
    entityId: proposal.id,
    details: {
      documentType: 'PROPOSAL',
      source: 'admin_proposal_send',
      reference: proposal.reference,
      proposalId: proposal.id,
      proposalReference: proposal.reference,
      customerId,
      leadId: proposal.leadId || proposal.lead?.id || ensuredLeadId,
      bookingId: proposal.bookingId,
      total: proposal.total,
      locale: proposal.locale,
      to: customer.email,
      subject: emailDispatch.subject,
      emailSendId: emailDispatch.emailSendId,
      emailOrbitaKind: 'proposal',
      emailOrbitaId: proposal.id,
      pdfUrl: uploadedPdf.publicUrl,
      pdfKey: uploadedPdf.path,
    },
  });

  if (proposal.leadId || proposal.lead?.id || ensuredLeadId) {
    await prisma.leadActivity.create({
      data: {
        leadId: proposal.leadId || proposal.lead?.id || ensuredLeadId!,
        type: 'EMAIL',
        title: 'Pressupost enviat',
        description: `Pressupost ${proposal.reference}`,
        metadata: {
          proposalId: proposal.id,
          reference: proposal.reference,
          to: customer.email,
          total: proposal.total,
          source: 'admin_proposal_send',
          emailSendId: emailDispatch.emailSendId,
          pdfUrl: uploadedPdf.publicUrl,
        },
        createdBy: 'Admin',
      },
    }).catch(() => undefined);
  }

  await ensureQuoteFollowUpTask({
    title: `Seguiment pressupost ${proposal.reference}`,
    description: 'Contactar client per confirmar resposta al pressupost enviat.',
    leadId: proposal.leadId || proposal.lead?.id || ensuredLeadId,
    customerId,
    bookingId: proposal.bookingId,
    proposalId: proposal.id,
  });

  return { status: 200, body: { ok: true, proposal } };
}
