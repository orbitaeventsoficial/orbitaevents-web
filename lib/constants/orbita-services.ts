/**
 * Catàleg de serveis PROPIS d'Òrbita que NO són packs ni extres de pack.
 *
 * Són serveis solts que Òrbita ofereix amb preu de venda propi i SENSE cost
 * extern de proveïdor (el cost operatiu —vehicle, amortització— ja l'imputa
 * `computeBookingFinancialSummary`). Es materialitzen com a `BookingServiceLine`
 * (kind corresponent) quan s'afegeixen a una reserva.
 *
 * Viuen com a dades aquí (no a BD) perquè són pocs i estables. Si el propietari
 * necessita editar-los en runtime, caldrà un model `OrbitaService` + migració.
 *
 * Productes de PARTNERS (animació, pintacares...) NO viuen aquí: són
 * `CollaboratorProduct` amb el seu escandall (costPrice/sellPrice +20%).
 */

// Mirall del enum Prisma `BookingServiceLineKind` (no importable a client sense
// arrossegar @prisma/client; es manté alineat manualment).
export type OrbitaServiceKind = 'DJ' | 'SOUND_TECH' | 'PROVIDER_SERVICE' | 'EQUIPMENT' | 'OTHER';

export interface OrbitaService {
  id: string;
  kind: OrbitaServiceKind;
  label: string;
  /** Preu de venda per defecte en € (overridable per línia). */
  defaultPrice: number;
  /** Unitat de facturació: per hora o per unitat. */
  unit: 'hour' | 'unit';
  /** Si és opcional (es pot afegir/treure lliurement, p. ex. el tècnic). */
  optional: boolean;
}

// ─── VERITAT ABSOLUTA DEL PREU (font única, propietari 2026-06-11) ────────────
// La regla DJ és l'àtom del negoci: TOT preu se'n deriva. Canviar aquests dos
// números actualitza serveis solts, packs (web + BD) i bolo alhora. Cap altre
// fitxer no pot tenir la seva pròpia còpia d'aquests valors.
//   1a hora = DJ_FIRST_HOUR_PRICE · cada hora extra = DJ_EXTRA_HOUR_PRICE.
//   N hores = 150 + (N-1)×100  →  1h=150 · 2h=250 · 5h=550.
export const DJ_FIRST_HOUR_PRICE = 150;
export const DJ_EXTRA_HOUR_PRICE = 100;

/** Preu derivat d'un servei de DJ per a N hores (≥1). Font única de qualsevol preu base. */
export function djPriceForHours(hours: number): number {
  const h = Math.max(1, Math.round(hours));
  return DJ_FIRST_HOUR_PRICE + (h - 1) * DJ_EXTRA_HOUR_PRICE;
}

// Preus ORIENTATIUS i editables. El preu final el pacta el propietari amb el
// client (camp "preu acordat"); aquests només acceleren. Ordenats amb el DJ
// (producte principal d'Òrbita) primer. Afegir-ne de nous = només una línia aquí.
// Els preus del DJ deriven de les constants canòniques (cap número repetit).
export const ORBITA_SERVICES: OrbitaService[] = [
  { id: 'dj-primera-hora', kind: 'DJ', label: 'DJ · 1a hora', defaultPrice: DJ_FIRST_HOUR_PRICE, unit: 'unit', optional: false },
  { id: 'dj-hora-addicional', kind: 'DJ', label: 'DJ · hora addicional', defaultPrice: DJ_EXTRA_HOUR_PRICE, unit: 'hour', optional: false },
  { id: 'tecnic-so', kind: 'SOUND_TECH', label: 'Tècnic de so (Òrbita)', defaultPrice: 40, unit: 'unit', optional: true },
];

export function getOrbitaService(id: string): OrbitaService | undefined {
  return ORBITA_SERVICES.find((service) => service.id === id);
}
