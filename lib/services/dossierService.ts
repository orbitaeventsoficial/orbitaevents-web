import 'server-only';
import { prisma } from '@/lib/prisma';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { buildDossierHtml, type DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import { sendEmail } from '@/lib/email';
import { recordEmailSend } from '@/lib/services/emailTrackingService';

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

  const allProducts = await getAnimacioProducts('ca');
  const products = allProducts.filter((p) => dossier.productIds.includes(p.id));
  const recipientEmail = dossier.email!;
  const clientInfo: DossierClientInfo = {
    nom: dossier.nom,
    empresa: dossier.empresa ?? undefined,
    telefon: dossier.telefon ?? undefined,
    email: recipientEmail,
    eventDesc: dossier.eventDesc ?? undefined,
    salutacio: dossier.salutacio ?? undefined,
  };
  const html = buildDossierHtml(clientInfo, products);

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
      text: `Hola ${dossier.nom},\n\nT'enviem el dossier amb les nostres propostes: ${productsLabel}.\n\nQualsevol dubte, contacta'ns al 654 46 70 87 o info@orbitaevents.com\n\nÒrbita Events`,
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
