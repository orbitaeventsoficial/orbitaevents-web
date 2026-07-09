import 'server-only';
import { prisma } from '@/lib/prisma';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getDossierCopy, getOrbitaDossierProducts } from '@/lib/constants/dossier-copy';
import { buildDossierHtml, type DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import { sendEmail } from '@/lib/email';
import { EMAIL_CONTACT } from '@/lib/constants/email';
import { getEventLabel } from '@/lib/constants';
import { recordEmailSend } from '@/lib/services/emailTrackingService';
import {
  collaboratorProductToAnimacioProduct,
  getDossierCollaboratorProductsByIds,
  legacyDossierCollaboratorProductIdFor,
} from '@/lib/services/collaboratorProductService';
import {
  hydrateDossierSnapshotProductImages,
  parseDossierLineSnapshot,
  productsFromDossierLineSnapshot,
  transportFromDossierLineSnapshot,
} from '@/lib/services/dossierSnapshotService';
import { DOCUMENT_ADMIN_LOG_ACTIONS, recordDocumentAdminLog } from '@/lib/services/documentAuditTrailService';

export type CreateDossierInput = {
  leadId?: string;
  nom: string;
  empresa?: string;
  telefon?: string;
  email?: string;
  eventDesc?: string;
  salutacio?: string;
  productIds: string[];
  lineSnapshot?: unknown;
  mode?: string;
};

export type DossierLeadInitialData = {
  id: string;
  nom: string;
  email: string;
  telefon: string;
  eventDesc: string;
  eventDate: string | null;
  travelLocation: string;
  distanceKm: number | null;
  tollsEur: number | null;
};

export type DossierTraceOrigin = {
  leadId: string | null;
  leadName: string | null;
  customerId: string | null;
  customerName: string | null;
};

export type DossierOutputTransport = {
  travelKm?: number;
  travelTollsEur?: number;
  travelLocation?: string;
  eventDate?: string;
};

export type BuildDossierHtmlForDossierOptions = {
  autoPrint?: boolean;
  logoDataUri?: string;
  locale?: string;
  assetBaseUrl?: string;
};

function formatLeadIsoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '';
}

function extractLeadMessageAddress(message: string | null): string {
  return message?.match(/(?:^|\n)\s*adre[cç]a\s*:\s*([^\n\r]+)/i)?.[1]?.trim() ?? '';
}

function cleanLeadDossierMessage(message: string | null): string {
  return (message ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^adre[cç]a\s*:/i.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDossierLeadEventDesc(lead: {
  eventType: string;
  eventDate: Date | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string | null;
  eventAddress: string | null;
  guestCount: number | null;
  message: string | null;
}): string {
  const schedule = lead.eventStartTime && lead.eventEndTime
    ? `${lead.eventStartTime}-${lead.eventEndTime}`
    : lead.eventStartTime;
  const address = buildDossierLeadTravelLocation(lead);
  const message = cleanLeadDossierMessage(lead.message);
  const parts = [
    lead.eventType && lead.eventType !== 'OTHER' ? getEventLabel(lead.eventType) : null,
    formatLeadIsoDate(lead.eventDate),
    schedule,
    address,
    lead.guestCount ? `${lead.guestCount} pax` : null,
    message,
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.join(' · ');
}

function buildDossierLeadTravelLocation(lead: {
  eventLocation: string | null;
  eventAddress: string | null;
  message: string | null;
}): string {
  return lead.eventAddress || extractLeadMessageAddress(lead.message) || lead.eventLocation || '';
}

export async function getDossierLeadInitialData(leadId?: string | null): Promise<DossierLeadInitialData | null> {
  if (!leadId) return null;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      eventDate: true,
      eventStartTime: true,
      eventEndTime: true,
      eventLocation: true,
      eventAddress: true,
      guestCount: true,
      message: true,
      distanceKm: true,
      tollsEur: true,
    },
  });
  if (!lead) return null;
  return {
    id: lead.id,
    nom: lead.name,
    email: lead.email,
    telefon: lead.phone ?? '',
    eventDesc: buildDossierLeadEventDesc(lead),
    eventDate: formatLeadIsoDate(lead.eventDate) || null,
    travelLocation: buildDossierLeadTravelLocation(lead),
    distanceKm: lead.distanceKm ?? null,
    tollsEur: lead.tollsEur ?? null,
  };
}

export async function resolveDossierTraceOrigin(leadId?: string | null): Promise<DossierTraceOrigin> {
  if (!leadId) {
    return { leadId: null, leadName: null, customerId: null, customerName: null };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      name: true,
      customerId: true,
      customer: { select: { name: true } },
    },
  });

  return {
    leadId,
    leadName: lead?.name ?? null,
    customerId: lead?.customerId ?? null,
    customerName: lead?.customer?.name ?? null,
  };
}

export async function createDossier(input: CreateDossierInput) {
  const lineSnapshot = parseDossierLineSnapshot(input.lineSnapshot);
  return prisma.dossier.create({
    data: {
      leadId: input.leadId || null,
      nom: input.nom,
      empresa: input.empresa || null,
      telefon: input.telefon || null,
      email: input.email || null,
      eventDesc: input.eventDesc || null,
      salutacio: input.salutacio || null,
      productIds: input.productIds,
      lineSnapshot: lineSnapshot || undefined,
      mode: input.mode || null,
    },
  });
}

export async function resolveDossierTransportOutput(input: {
  lineSnapshot: unknown;
  leadId?: string | null;
}): Promise<DossierOutputTransport> {
  const snapshotTransport = transportFromDossierLineSnapshot(input.lineSnapshot);
  let travelKm: number | undefined = snapshotTransport.travelKm;
  let travelTollsEur: number | undefined = snapshotTransport.travelTollsEur;
  let travelLocation: string | undefined = snapshotTransport.travelLocation;
  let eventDate: string | undefined = snapshotTransport.eventDate;
  const fallbackLeadId = input.leadId ?? null;

  if (fallbackLeadId && (travelKm == null || travelTollsEur == null || !travelLocation || !eventDate)) {
    const lead = await prisma.lead.findUnique({
      where: { id: fallbackLeadId },
      select: { distanceKm: true, tollsEur: true, eventLocation: true, eventDate: true },
    });
    if (travelKm == null && lead?.distanceKm != null && lead.distanceKm > 0) travelKm = lead.distanceKm;
    if (travelTollsEur == null && lead?.tollsEur != null && lead.tollsEur > 0) travelTollsEur = lead.tollsEur;
    if (!travelLocation && lead?.eventLocation) travelLocation = lead.eventLocation;
    if (!eventDate && lead?.eventDate) eventDate = formatLeadIsoDate(lead.eventDate);
  }

  return { travelKm, travelTollsEur, travelLocation, eventDate };
}

export async function getDossiersByLead(leadId: string) {
  return prisma.dossier.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllDossiers(limit = 50) {
  return prisma.$queryRaw<unknown[]>`
    SELECT d.*,
      CASE WHEN d."leadId" IS NOT NULL THEN
        jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status, 'customerId', l."customerId", 'customerName', c.name)
      END AS lead
    FROM "dossiers" d
    LEFT JOIN "leads" l ON l.id = d."leadId"
    LEFT JOIN "customers" c ON c.id = l."customerId"
    WHERE d."deletedAt" IS NULL
    ORDER BY d."createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function getDossierById(id: string) {
  return prisma.dossier.findUnique({ where: { id } });
}

export async function resolveDossierHtmlRenderPayload(id: string) {
  const dossier = await prisma.dossier.findUnique({ where: { id } });
  if (!dossier) return null;

  const [allProducts, orbitaProducts, dossierCopy, collaboratorDossierProducts] = await Promise.all([
    getAnimacioProducts('ca'),
    getOrbitaDossierProducts('ca'),
    getDossierCopy('ca'),
    getDossierCollaboratorProductsByIds(dossier.productIds),
  ]);
  const collaboratorProducts = collaboratorDossierProducts.map(collaboratorProductToAnimacioProduct);
  const resolvedLegacyProductIds = new Set(
    collaboratorDossierProducts
      .map(legacyDossierCollaboratorProductIdFor)
      .filter((id): id is string => Boolean(id)),
  );
  const snapshotProducts = hydrateDossierSnapshotProductImages(
    productsFromDossierLineSnapshot(dossier.lineSnapshot),
    [...orbitaProducts, ...allProducts, ...collaboratorProducts],
  );
  const products = snapshotProducts ?? [
    ...orbitaProducts.filter((p) => dossier.productIds.includes(p.id)),
    ...allProducts.filter((p) => dossier.productIds.includes(p.id) && !resolvedLegacyProductIds.has(p.id)),
    ...collaboratorProducts,
  ];
  const clientInfo: DossierClientInfo = {
    nom: dossier.nom,
    empresa: dossier.empresa ?? undefined,
    telefon: dossier.telefon ?? undefined,
    email: dossier.email ?? undefined,
    eventDesc: dossier.eventDesc ?? undefined,
    salutacio: dossier.salutacio ?? undefined,
  };
  const transport = await resolveDossierTransportOutput({
    lineSnapshot: dossier.lineSnapshot,
    leadId: dossier.leadId,
  });

  return {
    dossier,
    clientInfo,
    products,
    dossierCopy,
    transport,
    collaboratorDossierProducts,
    dataSource: snapshotProducts ? 'snapshot' as const : 'live_catalog' as const,
  };
}

export async function buildDossierHtmlForDossier(id: string, options: BuildDossierHtmlForDossierOptions = {}) {
  const payload = await resolveDossierHtmlRenderPayload(id);
  if (!payload) return null;
  const html = buildDossierHtml(payload.clientInfo, payload.products, payload.dossierCopy, {
    autoPrint: options.autoPrint,
    logoDataUri: options.logoDataUri,
    locale: options.locale ?? 'ca-ES',
    travelKm: payload.transport.travelKm,
    travelTollsEur: payload.transport.travelTollsEur,
    location: payload.transport.travelLocation,
    eventDate: payload.transport.eventDate,
    assetBaseUrl: options.assetBaseUrl,
  });
  return { ...payload, html };
}

export async function softDeleteDossier(id: string) {
  await prisma.$executeRaw`UPDATE "dossiers" SET "deletedAt" = NOW() WHERE id = ${id}`;
}

export async function restoreDossier(id: string) {
  await prisma.$executeRaw`UPDATE "dossiers" SET "deletedAt" = NULL WHERE id = ${id}`;
}

export async function purgeDossier(id: string) {
  return prisma.dossier.delete({ where: { id } });
}

export async function getDeletedDossiers() {
  return prisma.$queryRaw<unknown[]>`
    SELECT d.*,
      CASE WHEN d."leadId" IS NOT NULL THEN
        jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status, 'customerId', l."customerId", 'customerName', c.name)
      END AS lead
    FROM "dossiers" d
    LEFT JOIN "leads" l ON l.id = d."leadId"
    LEFT JOIN "customers" c ON c.id = l."customerId"
    WHERE d."deletedAt" IS NOT NULL
    ORDER BY d."deletedAt" DESC
  `;
}

export async function purgeExpiredDossiers(cutoff: Date): Promise<number> {
  const count = await prisma.$executeRaw`
    DELETE FROM "dossiers" WHERE "deletedAt" IS NOT NULL AND "deletedAt" <= ${cutoff}
  `;
  return count;
}

/** @deprecated Usar softDeleteDossier */
export async function deleteDossier(id: string) {
  return softDeleteDossier(id);
}

export async function sendDossierByEmail(id: string): Promise<{ ok: boolean; error?: string }> {
  const render = await buildDossierHtmlForDossier(id, { locale: 'ca-ES' });
  if (!render) return { ok: false, error: 'Dossier no trobat' };
  const { dossier, html, products, dataSource } = render;
  if (!dossier.email) return { ok: false, error: 'El dossier no té email de destinatari' };
  const origin = await resolveDossierTraceOrigin(dossier.leadId);
  const recipientEmail = dossier.email!;

  const productsLabel = products.map((p) => p.nom).join(', ');
  const subject = `Dossier Òrbita Events — ${dossier.nom}`;

  try {
    // Vinculació X-Orbita: si el dossier ve d'un lead, el client respon i el
    // reply matcheja directament el lead via In-Reply-To.
    const orbitaCtx = dossier.leadId
      ? { kind: 'lead' as const, id: dossier.leadId, origin: `dossier-${id}` }
      : { kind: 'dossier' as const, id, origin: `dossier-${id}` };

    const sendResult = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: `Hola ${dossier.nom},\n\nT'enviem el dossier amb les nostres propostes: ${productsLabel}.\n\nQualsevol dubte, contacta'ns al ${EMAIL_CONTACT.phone} o ${EMAIL_CONTACT.email}\n\nÒrbita Events`,
      orbita: orbitaCtx,
    });

    const now = new Date();
    await prisma.dossier.update({
      where: { id },
      data: { sentAt: now, sentTo: recipientEmail },
    });

    const tracking = await recordEmailSend({
      templateKey: 'dossier',
      to: recipientEmail,
      subject,
      leadId: dossier.leadId || null,
      htmlBody: html,
      orbitaKind: orbitaCtx.kind,
      orbitaId: orbitaCtx.id ?? null,
      orbitaOrigin: orbitaCtx.origin ?? null,
    }).catch(() => null);

    if (tracking?.id) {
      const { updateEmailSendResult } = await import('@/lib/services/emailTrackingService');
      await updateEmailSendResult(tracking.id, {
        smtpAccepted: sendResult.smtp.accepted,
        smtpRejected: sendResult.smtp.rejected,
        smtpResponse: sendResult.smtp.response,
        smtpMessageId: sendResult.smtp.messageId,
        imapAppendOk: sendResult.imapSent.attempted ? sendResult.imapSent.ok : null,
        imapSentFolder: sendResult.imapSent.folder,
        imapSentUid: sendResult.imapSent.uid ?? null,
        imapError: sendResult.imapSent.error ?? null,
      });
    }

    await recordDocumentAdminLog({
      action: DOCUMENT_ADMIN_LOG_ACTIONS.DOSSIER_SENT,
      entity: 'dossier',
      entityId: id,
      details: {
        documentType: 'DOSSIER',
        source: 'dossier_email_send',
        dataSource,
        dossierId: id,
        leadId: origin.leadId,
        leadName: origin.leadName,
        customerId: origin.customerId,
        customerName: origin.customerName,
        to: recipientEmail,
        subject,
        productIds: dossier.productIds,
        productCount: products.length,
        emailSendId: tracking?.id ?? null,
        orbitaKind: orbitaCtx.kind,
        orbitaId: orbitaCtx.id,
        orbitaOrigin: orbitaCtx.origin,
      },
    });

    return { ok: true };
  } catch (err) {
    console.error('[dossierService] sendDossierByEmail error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconegut' };
  }
}
