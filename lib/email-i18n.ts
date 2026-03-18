/**
 * Traduccions i18n per les plantilles d'email.
 * Extret de email.ts per reduir la mida del fitxer principal.
 */

import { escapeHtml } from '@/lib/utils/sanitize';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EmailLocale = 'ca' | 'es' | 'en';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function normalizeEmailLocale(value?: string | null): EmailLocale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ca')) return 'ca';
  return 'es';
}

export function toIntlLocaleEmail(locale: EmailLocale): string {
  if (locale === 'ca') return 'ca-ES';
  if (locale === 'en') return 'en-GB';
  return 'es-ES';
}

// ─── Privacy i18n ───────────────────────────────────────────────────────────

export const PRIVACY_REQUEST_LABELS: Record<EmailLocale, Record<string, string>> = {
  ca: {
    ACCESS: 'Dret d\'accés',
    RECTIFICATION: 'Dret de rectificació',
    ERASURE: 'Dret de supressió',
    RESTRICTION: 'Dret de limitació',
    PORTABILITY: 'Dret de portabilitat',
    OBJECTION: 'Dret d\'oposició',
    AUTOMATED: 'Decisions automatitzades',
  },
  es: {
    ACCESS: 'Derecho de acceso',
    RECTIFICATION: 'Derecho de rectificación',
    ERASURE: 'Derecho de supresión',
    RESTRICTION: 'Derecho de limitación',
    PORTABILITY: 'Derecho de portabilidad',
    OBJECTION: 'Derecho de oposición',
    AUTOMATED: 'Decisiones automatizadas',
  },
  en: {
    ACCESS: 'Right of access',
    RECTIFICATION: 'Right to rectification',
    ERASURE: 'Right to erasure',
    RESTRICTION: 'Right to restriction',
    PORTABILITY: 'Right to data portability',
    OBJECTION: 'Right to object',
    AUTOMATED: 'Automated decisions',
  },
};

export const PRIVACY_COPY: Record<EmailLocale, {
  portalTitle: string;
  verifyTitle: string;
  greeting: (name: string) => string;
  received: (label: string) => string;
  verifyInstructions: string;
  verifyCta: string;
  linkValid: string;
  linkIgnore: string;
  reference: string;
  legalDeadline: string;
  linkFallback: string;
  allRights: string;
  gdprNote: string;
  processed: string;
  rejected: string;
  processedBody: (label: string) => string;
  rejectedBody: (label: string) => string;
  notes: string;
  downloadCta: string;
  contactNote: string;
}> = {
  ca: {
    portalTitle: 'Portal de privacitat',
    verifyTitle: 'Verifica la teva sol·licitud',
    greeting: (name) => `Hola <strong>${escapeHtml(name)}</strong>,`,
    received: (label) => `Hem rebut la teva sol·licitud de <strong style="color: #DAA520;">${escapeHtml(label)}</strong>.`,
    verifyInstructions: 'Per verificar la teva identitat i processar la sol·licitud, fes clic al botó següent:',
    verifyCta: 'Verificar sol·licitud',
    linkValid: 'Aquest enllaç és vàlid durant <strong>7 dies</strong>.',
    linkIgnore: 'Si no has sol·licitat això, pots ignorar aquest email.',
    reference: 'Referència:',
    legalDeadline: 'Termini legal de resposta:',
    linkFallback: 'Si el botó no funciona, copia i enganxa aquest enllaç al navegador:',
    allRights: 'Òrbita Events. Tots els drets reservats.',
    gdprNote: 'Aquest email ha estat enviat en resposta a una sol·licitud RGPD.',
    processed: 'Sol·licitud processada',
    rejected: 'Sol·licitud rebutjada',
    processedBody: (label) => `T'informem que la teva sol·licitud de <strong style="color: #DAA520;">${escapeHtml(label)}</strong> ha estat <strong>processada correctament</strong>.`,
    rejectedBody: (label) => `T'informem que la teva sol·licitud de <strong style="color: #DAA520;">${escapeHtml(label)}</strong> ha estat <strong>rebutjada</strong>.`,
    notes: 'Notes:',
    downloadCta: 'Descarregar les teves dades',
    contactNote: 'Si tens qualsevol dubte o necessites més informació, contacta\'ns a',
  },
  es: {
    portalTitle: 'Portal de privacidad',
    verifyTitle: 'Verifica tu solicitud',
    greeting: (name) => `Hola <strong>${escapeHtml(name)}</strong>,`,
    received: (label) => `Hemos recibido tu solicitud de <strong style="color: #DAA520;">${escapeHtml(label)}</strong>.`,
    verifyInstructions: 'Para verificar tu identidad y procesar la solicitud, haz clic en el siguiente botón:',
    verifyCta: 'Verificar solicitud',
    linkValid: 'Este enlace es válido durante <strong>7 días</strong>.',
    linkIgnore: 'Si no has solicitado esto, puedes ignorar este email.',
    reference: 'Referencia:',
    legalDeadline: 'Plazo legal de respuesta:',
    linkFallback: 'Si el botón no funciona, copia y pega este enlace en el navegador:',
    allRights: 'Òrbita Events. Todos los derechos reservados.',
    gdprNote: 'Este email ha sido enviado en respuesta a una solicitud RGPD.',
    processed: 'Solicitud procesada',
    rejected: 'Solicitud rechazada',
    processedBody: (label) => `Te informamos que tu solicitud de <strong style="color: #DAA520;">${escapeHtml(label)}</strong> ha sido <strong>procesada correctamente</strong>.`,
    rejectedBody: (label) => `Te informamos que tu solicitud de <strong style="color: #DAA520;">${escapeHtml(label)}</strong> ha sido <strong>rechazada</strong>.`,
    notes: 'Notas:',
    downloadCta: 'Descargar tus datos',
    contactNote: 'Si tienes cualquier duda o necesitas más información, contáctanos en',
  },
  en: {
    portalTitle: 'Privacy portal',
    verifyTitle: 'Verify your request',
    greeting: (name) => `Hi <strong>${escapeHtml(name)}</strong>,`,
    received: (label) => `We have received your <strong style="color: #DAA520;">${escapeHtml(label)}</strong> request.`,
    verifyInstructions: 'To verify your identity and process your request, please click the button below:',
    verifyCta: 'Verify request',
    linkValid: 'This link is valid for <strong>7 days</strong>.',
    linkIgnore: 'If you did not request this, you can safely ignore this email.',
    reference: 'Reference:',
    legalDeadline: 'Legal response deadline:',
    linkFallback: 'If the button does not work, copy and paste this link into your browser:',
    allRights: 'Òrbita Events. All rights reserved.',
    gdprNote: 'This email was sent in response to a GDPR request.',
    processed: 'Request processed',
    rejected: 'Request rejected',
    processedBody: (label) => `We inform you that your <strong style="color: #DAA520;">${escapeHtml(label)}</strong> request has been <strong>successfully processed</strong>.`,
    rejectedBody: (label) => `We inform you that your <strong style="color: #DAA520;">${escapeHtml(label)}</strong> request has been <strong>rejected</strong>.`,
    notes: 'Notes:',
    downloadCta: 'Download your data',
    contactNote: 'If you have any questions or need more information, contact us at',
  },
};

// ─── Testimonial i18n ───────────────────────────────────────────────────────

export const TESTIMONIAL_COPY: Record<EmailLocale, {
  trustHeader: string;
  subject: (pct: number) => string;
  giftAlt: (pct: number) => string;
  imgFallback: string;
  greeting: (name: string) => string;
  approved: string;
  exclusiveCode: string;
  discount: (pct: number) => string;
  validity: string;
  share: string;
  viewServices: string;
}> = {
  ca: {
    trustHeader: 'GRÀCIES PER CONFIAR EN NOSALTRES',
    subject: (pct) => `Gràcies per la teva opinió! Aquí tens el teu ${pct}% de descompte — Òrbita Events`,
    giftAlt: (pct) => `El teu regal de ${pct}% de descompte`,
    imgFallback: 'Veure regal',
    greeting: (name) => `Hola ${name}!`,
    approved: 'La teva opinió ha estat aprovada i publicada. Ens fa molta il·lusió llegir-te.',
    exclusiveCode: 'El teu codi exclusiu',
    discount: (pct) => `${pct}% DESCOMPTE`,
    validity: 'Vàlid durant 6 mesos per al teu pròxim esdeveniment',
    share: 'Comparteix aquest codi amb amics i família. Si organitzen un event amb nosaltres, tots hi guanyeu.',
    viewServices: 'Veure els nostres serveis',
  },
  es: {
    trustHeader: 'GRACIAS POR CONFIAR EN NOSOTROS',
    subject: (pct) => `Gracias por tu opinión! Aquí tienes tu ${pct}% de descuento — Òrbita Events`,
    giftAlt: (pct) => `Tu regalo de ${pct}% de descuento`,
    imgFallback: 'Ver regalo',
    greeting: (name) => `Hola ${name}!`,
    approved: 'Tu opinión ha sido aprobada y publicada. Nos hace mucha ilusión leerte.',
    exclusiveCode: 'Tu código exclusivo',
    discount: (pct) => `${pct}% DESCUENTO`,
    validity: 'Válido durante 6 meses para tu próximo evento',
    share: 'Comparte este código con amigos y familia. Si organizan un evento con nosotros, todos ganáis.',
    viewServices: 'Ver nuestros servicios',
  },
  en: {
    trustHeader: 'THANK YOU FOR TRUSTING US',
    subject: (pct) => `Thanks for your review! Here's your ${pct}% discount — Òrbita Events`,
    giftAlt: (pct) => `Your ${pct}% discount gift`,
    imgFallback: 'View gift',
    greeting: (name) => `Hi ${name}!`,
    approved: 'Your review has been approved and published. We love reading your feedback.',
    exclusiveCode: 'Your exclusive code',
    discount: (pct) => `${pct}% DISCOUNT`,
    validity: 'Valid for 6 months for your next event',
    share: 'Share this code with friends and family. If they book an event with us, everyone wins.',
    viewServices: 'View our services',
  },
};
