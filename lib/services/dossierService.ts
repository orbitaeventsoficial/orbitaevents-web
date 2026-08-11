import 'server-only';
import { prisma } from '@/lib/prisma';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';
import { getDossierCopy, getOrbitaDossierProducts } from '@/lib/constants/dossier-copy';
import { buildDossierHtml, type DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import { sendEmail } from '@/lib/email';
import { toIntlLocale } from '@/lib/constants';
import { EMAIL_CONTACT } from '@/lib/constants/email';
import { recordEmailSend } from '@/lib/services/emailTrackingService';
import {
  collaboratorProductToAnimacioProduct,
  getDossierCollaboratorProductsByIds,
} from '@/lib/services/collaboratorProductService';
import { DOSSIER_LOCALES, type DossierLocale } from '@/lib/constants/dossier-locales';
import {
  buildDossierDocument,
  renderDossierPdf,
  type DossierLineSnapshot,
} from '@/lib/services/dossierDocumentService';

export type CreateDossierInput = {
  leadId?: string;
  nom: string;
  empresa?: string;
  telefon?: string;
  email?: string;
  eventDesc?: string;
  salutacio?: string;
  productIds: string[];
  /** La llengua triada per qui envia el dossier. Queda desada amb el document. */
  locale?: DossierLocale;
  /**
   * La foto del bolo: línies de preu acordades i quilòmetres de desplaçament.
   * Sense això el document que refà el servidor no és el que s'ha vist a la
   * pantalla, perquè li falten els preus.
   */
  lineSnapshot?: DossierLineSnapshot;
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
      locale: input.locale && DOSSIER_LOCALES.includes(input.locale) ? input.locale : null,
      productIds: input.productIds,
      lineSnapshot: input.lineSnapshot ? { ...input.lineSnapshot } : undefined,
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
        jsonb_build_object('id', l.id, 'name', l.name, 'status', l.status,
                           'preferredLocale', l."preferredLocale")
      END AS lead
    FROM "dossiers" d
    LEFT JOIN "leads" l ON l.id = d."leadId"
    WHERE d."deletedAt" IS NULL
    ORDER BY d."createdAt" DESC
    LIMIT ${limit}
  `;
}

/**
 * En quina llengua es fa un dossier.
 *
 * La resposta la dona la fitxa de l'entrada, que és on el propietari tria
 * l'idioma del client. Un dossier sense entrada cau al castellà, que és el
 * mateix valor per defecte que fa servir la base de dades.
 */
export type { DossierLocale };

export function dossierLocaleOf(preferredLocale?: string | null): DossierLocale {
  return (DOSSIER_LOCALES as readonly string[]).includes(preferredLocale ?? '')
    ? (preferredLocale as DossierLocale)
    : 'es';
}

export async function dossierLocaleForLead(leadId?: string | null): Promise<DossierLocale> {
  if (!leadId) return 'es';
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { preferredLocale: true },
  });
  return dossierLocaleOf(lead?.preferredLocale);
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

/**
 * El cos del correu, que ja no és el dossier.
 *
 * El dossier viatja adjunt en PDF. El cos només ha de dir qui escriu, què
 * s'envia i com contestar: un correu amb un document sencer enganxat a dins es
 * veu trencat a la meitat dels clients de correu i no es pot desar ni reenviar.
 */
function buildDossierEmailBody(nom: string, productsLabel: string): string {
  const esc = (value: string) => value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="ca"><body style="margin:0;padding:24px;background:#fbf8f1;font-family:Georgia,'Times New Roman',serif;color:#211d16;">
  <div style="max-width:520px;margin:0 auto;">
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hola ${esc(nom)},</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
      T'enviem adjunt el dossier amb les nostres propostes: ${esc(productsLabel)}.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      Qualsevol dubte, respon aquest correu o truca'ns al
      <a href="tel:${esc(EMAIL_CONTACT.phone)}" style="color:#a9863f;">${esc(EMAIL_CONTACT.phone)}</a>.
    </p>
    <p style="font-size:14px;line-height:1.6;margin:0;color:#7a7264;">Òrbita Events</p>
  </div>
</body></html>`;
}

export async function sendDossierByEmail(id: string): Promise<{ ok: boolean; error?: string }> {
  const dossier = await prisma.dossier.findUnique({ where: { id } });
  if (!dossier) return { ok: false, error: 'Dossier no trobat' };
  if (!dossier.email) return { ok: false, error: 'El dossier no té email de destinatari' };

  const recipientEmail = dossier.email!;

  /**
   * El mateix document que es previsualitza, sense excepcions.
   *
   * Abans aquí es tornava a muntar l'HTML a mà i es cridava el constructor
   * només amb l'idioma: el client rebia el dossier sense logo i sense les
   * línies de preu que s'havien aprovat a la pantalla.
   */
  const document = await buildDossierDocument(id);
  if (!document) return { ok: false, error: 'Dossier no trobat' };

  let pdf: Buffer;
  try {
    pdf = await renderDossierPdf(document.html);
  } catch (err) {
    console.error('[dossierService] no s\'ha pogut imprimir el dossier a PDF:', err);
    return {
      ok: false,
      error: 'No s\'ha pogut generar el PDF del dossier. No s\'ha enviat res: '
        + 'val més no enviar-lo que enviar-ne un de diferent del que has aprovat.',
    };
  }

  const productsLabel = document.productNames.join(', ');
  const subject = `Dossier Òrbita Events — ${dossier.nom}`;
  const html = buildDossierEmailBody(dossier.nom, productsLabel);

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
      text: `Hola ${dossier.nom},\n\nT'enviem adjunt el dossier amb les nostres propostes: ${productsLabel}.\n\nQualsevol dubte, contacta'ns al ${EMAIL_CONTACT.phone} o ${EMAIL_CONTACT.email}\n\nÒrbita Events`,
      attachments: [{ filename: document.filename, content: pdf, contentType: 'application/pdf' }],
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
