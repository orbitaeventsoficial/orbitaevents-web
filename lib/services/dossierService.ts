import 'server-only';
import { prisma } from '@/lib/prisma';
import { ANIMACIO_PRODUCTS } from '@/lib/constants/animacio-products';
import { buildDossierHtml, type DossierClientInfo } from '@/lib/utils/dossier-html-builder';
import { sendEmail } from '@/lib/email';

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
  return prisma.dossier.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      lead: { select: { id: true, name: true, status: true } },
    },
  });
}

export async function getDossierById(id: string) {
  return prisma.dossier.findUnique({ where: { id } });
}

export async function deleteDossier(id: string) {
  return prisma.dossier.delete({ where: { id } });
}

export async function sendDossierByEmail(id: string): Promise<{ ok: boolean; error?: string }> {
  const dossier = await prisma.dossier.findUnique({ where: { id } });
  if (!dossier) return { ok: false, error: 'Dossier no trobat' };
  if (!dossier.email) return { ok: false, error: 'El dossier no té email de destinatari' };

  const products = ANIMACIO_PRODUCTS.filter((p) => dossier.productIds.includes(p.id));
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
    await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: `Hola ${dossier.nom},\n\nT'enviem el dossier amb les nostres propostes: ${productsLabel}.\n\nQualsevol dubte, contacta'ns al 654 46 70 87 o info@orbitaevents.com\n\nÒrbita Events`,
    });

    await prisma.dossier.update({
      where: { id },
      data: { sentAt: new Date(), sentTo: recipientEmail },
    });

    return { ok: true };
  } catch (err) {
    console.error('[dossierService] sendDossierByEmail error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconegut' };
  }
}
