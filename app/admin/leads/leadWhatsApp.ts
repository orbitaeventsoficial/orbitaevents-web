/**
 * Helper canònic del domini Leads per construir l'enllaç de WhatsApp cap a un
 * lead. Centralitza el patró `wa.me` i el missatge d'obertura perquè no visqui
 * duplicat (i divergent) a cada component que té un botó de WhatsApp.
 *
 * Monocapa (CLAUDE.md): abans hi havia tres `buildLeadWhatsAppHref` locals amb
 * tres redaccions diferents. Aquesta és l'única font.
 */

/** Missatge d'obertura per defecte quan contactem un lead per WhatsApp. */
export function leadWhatsAppGreeting(name: string): string {
  return `Hola ${name}! Et contactem des d'Òrbita Events per la teva sol·licitud.`;
}

/**
 * Construeix l'URL `wa.me` per a un lead. Neteja el telèfon a només dígits i
 * codifica el missatge. Retorna `null` si no hi ha cap telèfon utilitzable.
 */
export function buildLeadWhatsAppHref(phone: string | null | undefined, name: string): string | null {
  const digits = (phone ?? '').replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(leadWhatsAppGreeting(name))}`;
}
