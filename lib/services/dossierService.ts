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
} from '@/lib/services/collaboratorProductService';

export type CreateDossierInput = {
  leadId?: string;
  nom: string;
  empresa?: string;
  telefon?: string;
  email?: string;
  eventDesc?: string;
  salutacio?: string;
  productIds: string[];
};

export type DossierLeadInitialData = {
  id: string;
  nom: string;
  email: string;
  telefon: string;
  eventDesc: string;
  distanceKm: number | null;
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
  const address = lead.eventAddress || extractLeadMessageAddress(lead.message) || lead.eventLocation;
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
    },
  });
  if (!lead) return null;
  return {
    id: lead.id,
    nom: lead.name,
    email: lead.email,
    telefon: lead.phone ?? '',
    eventDesc: buildDossierLeadEventDesc(lead),
    distanceKm: lead.distanceKm ?? null,
  };
}

export async function createDossier(input: CreateDossierInput) {
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
    },
  });
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
        jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status)
      END AS lead
    FROM "dossiers" d
    LEFT JOIN "leads" l ON l.id = d."leadId"
    WHERE d."deletedAt" IS NULL
    ORDER BY d."createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function getDossierById(id: string) {
  return prisma.dossier.findUnique({ where: { id } });
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
        jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status)
      END AS lead
    FROM "dossiers" d
    LEFT JOIN "leads" l ON l.id = d."leadId"
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
  const dossier = await prisma.dossier.findUnique({ where: { id } });
  if (!dossier) return { ok: false, error: 'Dossier no trobat' };
  if (!dossier.email) return { ok: false, error: 'El dossier no té email de destinatari' };

  const [allProducts, orbitaProducts, dossierCopy] = await Promise.all([
    getAnimacioProducts('ca'),
    getOrbitaDossierProducts('ca'),
    getDossierCopy('ca'),
  ]);
  const collaboratorProducts = await getDossierCollaboratorProductsByIds(dossier.productIds);
  const products = [
    ...orbitaProducts.filter((p) => dossier.productIds.includes(p.id)),
    ...allProducts.filter((p) => dossier.productIds.includes(p.id)),
    ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
  ];
  const recipientEmail = dossier.email!;
  const clientInfo: DossierClientInfo = {
    nom: dossier.nom,
    empresa: dossier.empresa ?? undefined,
    telefon: dossier.telefon ?? undefined,
    email: recipientEmail,
    eventDesc: dossier.eventDesc ?? undefined,
    salutacio: dossier.salutacio ?? undefined,
  };
  // Desplaçament al dossier enviat (#1394): el generador ja passa `travelKm` en viu, però
  // l'email no ho feia → la secció de desplaçament de la pàgina de proposta (que només es
  // pinta si travelKm>0) quedava buida. El dossier no desa el km; si ve d'un lead, l'agafem
  // del lead (font única) perquè la proposta surti sencera i el client decideixi conscient.
  // Sense suma dels elements: el dossier és catàleg, no factura (#1396/#1397).
  let travelKm: number | undefined;
  let travelLocation: string | undefined;
  if (dossier.leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: dossier.leadId },
      select: { distanceKm: true, eventLocation: true },
    });
    if (lead?.distanceKm != null && lead.distanceKm > 0) travelKm = lead.distanceKm;
    if (lead?.eventLocation) travelLocation = lead.eventLocation;
  }
  const html = buildDossierHtml(clientInfo, products, dossierCopy, {
    locale: 'ca-ES',
    travelKm,
    location: travelLocation,
  });

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

    return { ok: true };
  } catch (err) {
    console.error('[dossierService] sendDossierByEmail error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconegut' };
  }
}
