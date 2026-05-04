/**
 * google-maps-url.ts — helpers per construir URLs canòniques de Google Maps.
 *
 * Tota la UI admin que vulgui mostrar una ubicació clicable cap a Maps ha de
 * passar per aquí — evita reescriure `https://www.google.com/maps/...` a
 * cada call site i centralitza l'`encodeURIComponent` segur.
 */

/**
 * URL de cerca a Google Maps (`Search by query`). Robusta davant de strings
 * buits o només espais — retorna `null` si no hi ha res a cercar.
 */
export function buildGoogleMapsSearchUrl(query: string | null | undefined): string | null {
  if (!query || typeof query !== 'string') return null;
  const trimmed = query.trim();
  if (trimmed.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}
