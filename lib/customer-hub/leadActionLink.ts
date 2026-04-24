import { buildLeadComposeHref, buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import type { LeadDTO } from './dto';

export type LeadActionLink = {
  href: string;
  label: string;
  external?: boolean;
} | null;

function buildWhatsappMessage(leadName: string): string {
  return `Hola ${leadName}, et contacto per seguir amb els detalls pendents del teu esdeveniment. Quan et va bé que ho tanquem?`;
}

export function buildLeadActionLink(lead: LeadDTO): LeadActionLink {
  const phone = lead.phone?.replace(/[^\d]/g, '') || '';

  if (lead.commercialBlocker?.label === 'Seguiment urgent' && phone) {
    return {
      href: `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsappMessage(lead.name))}`,
      label: 'Desencallar per WhatsApp',
      external: true,
    };
  }

  if (
    lead.commercialBlocker?.label === 'Seguiment pendent' ||
    lead.commercialBlocker?.label === 'Pressupost pendent' ||
    lead.commercialBlocker?.label === 'Primera resposta pendent'
  ) {
    return {
      href: buildLeadComposeHref(lead.id, 'recordatori'),
      label: lead.commercialBlocker.label === 'Pressupost pendent' ? 'Enviar recordatori' : 'Preparar seguiment',
    };
  }

  if (lead.commercialBlocker?.label === 'Passar a reserva') {
    return {
      href: buildLeadWorkspaceHref(lead.id),
      label: 'Tancar conversió',
    };
  }

  return {
    href: buildLeadWorkspaceHref(lead.id),
    label: 'Obrir lead',
  };
}
