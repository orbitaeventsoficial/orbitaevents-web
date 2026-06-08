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

export const ORBITA_SERVICES: OrbitaService[] = [
  { id: 'dj-hora', kind: 'DJ', label: 'Hora extra de DJ', defaultPrice: 100, unit: 'hour', optional: false },
  { id: 'tecnic-so', kind: 'SOUND_TECH', label: 'Tècnic de so (Òrbita)', defaultPrice: 40, unit: 'unit', optional: true },
];

export function getOrbitaService(id: string): OrbitaService | undefined {
  return ORBITA_SERVICES.find((service) => service.id === id);
}
