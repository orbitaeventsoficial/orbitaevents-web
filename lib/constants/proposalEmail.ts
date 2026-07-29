export type ProposalEmailLocale = 'ca' | 'es' | 'en';

export const PROPOSAL_EMAIL_TEMPLATE_KEY = 'proposal-send';

export const PROPOSAL_EMAIL_COPY: Record<ProposalEmailLocale, {
  subjectPrefix: string;
  greetingFallback: string;
  intro: string;
  attached: string;
  review: string;
  close: string;
}> = {
  ca: {
    subjectPrefix: 'Pressupost',
    greetingFallback: 'Hola',
    intro: 'T\'adjuntem el pressupost final en PDF, generat des de la proposta canònica d\'Òrbita Events.',
    attached: 'Aquest és el document que queda registrat al sistema com a pressupost enviat.',
    review: 'Revisa\'l amb calma i respon aquest correu si vols ajustar algun detall abans de confirmar.',
    close: 'Gràcies per confiar en Òrbita Events.',
  },
  es: {
    subjectPrefix: 'Presupuesto',
    greetingFallback: 'Hola',
    intro: 'Te adjuntamos el presupuesto final en PDF, generado desde la propuesta canónica de Òrbita Events.',
    attached: 'Este es el documento que queda registrado en el sistema como presupuesto enviado.',
    review: 'Revísalo con calma y responde a este correo si quieres ajustar algún detalle antes de confirmar.',
    close: 'Gracias por confiar en Òrbita Events.',
  },
  en: {
    subjectPrefix: 'Quote',
    greetingFallback: 'Hello',
    intro: 'Please find attached the final quote PDF, generated from the canonical Òrbita Events proposal.',
    attached: 'This is the document recorded in the system as the sent quote.',
    review: 'Review it when convenient and reply to this email if you would like to adjust any detail before confirming.',
    close: 'Thank you for choosing Òrbita Events.',
  },
};

export function normalizeProposalEmailLocale(value?: string | null): ProposalEmailLocale {
  const raw = String(value || '').trim().toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  return 'ca';
}

export function buildProposalEmailSubject(reference: string, locale: ProposalEmailLocale): string {
  return `${PROPOSAL_EMAIL_COPY[locale].subjectPrefix} ${reference} - Òrbita Events`;
}
