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
  /**
   * Cost real de sèrie, quan el servei en té un de conegut i propi.
   *
   * El DJ i el material no en porten: el seu desgast ja viu al cost operatiu
   * fix del bolo i imputar-lo dues vegades seria mentir-se. El candybar sí:
   * les llaminadures es compren cada cop i surten de la butxaca.
   */
  defaultCost?: number;
}

// ─── VERITAT ABSOLUTA DEL PREU (font única, propietari 2026-06-11) ────────────
// La regla DJ és l'àtom del negoci: TOT preu se'n deriva. Canviar aquests dos
// números actualitza serveis solts, packs (web + BD) i bolo alhora. Cap altre
// fitxer no pot tenir la seva pròpia còpia d'aquests valors.
//   1a hora = DJ_FIRST_HOUR_PRICE · cada hora extra = DJ_EXTRA_HOUR_PRICE.
//   N hores = 150 + (N-1)×100  →  1h=150 · 2h=250 · 5h=550.
export const DJ_FIRST_HOUR_PRICE = 150;
export const DJ_EXTRA_HOUR_PRICE = 100;

// Nens que ja porta el candybar de sèrie. Els que passin d'aquí es cobren.
export const CANDYBAR_INCLUDED_CHILDREN = 20;

// Tècnic de so d'Òrbita: 40 € per 1,5 h. Font única del cost del tècnic, sigui
// que es vengui sol o que substitueixi el tècnic inclòs en un producte de
// proveïdor (animació/bingo de Masquerade). Un sol número per a tot el sistema.
export const SOUND_TECH_PRICE = 40;
export const SOUND_TECH_DURATION = '1,5 h';

/**
 * Detecta si un producte de proveïdor porta tècnic de so intrínsec (a partir
 * del camp `crew`, p. ex. «Animador + tècnic de so»). No hardcodeja cap
 * proveïdor: només llegeix la composició de l'equip que ja és dada del producte.
 */
export function productIncludesSoundTech(crew?: string | null): boolean {
  if (!crew) return false;
  return /t[eè]cnic\s+de\s+so/i.test(crew);
}

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
  { id: 'tecnic-so', kind: 'SOUND_TECH', label: `Tècnic de so · ${SOUND_TECH_DURATION}`, defaultPrice: SOUND_TECH_PRICE, unit: 'unit', optional: true },
  { id: 'bombolles', kind: 'EQUIPMENT', label: 'Màquina de bombolles', defaultPrice: 50, unit: 'unit', optional: true },
  { id: 'caps-mobils', kind: 'EQUIPMENT', label: 'Caps mòbils (llum)', defaultPrice: 120, unit: 'unit', optional: true },
  { id: 'operari-extra', kind: 'OTHER', label: 'Operari extra', defaultPrice: 50, unit: 'unit', optional: true },
  // Decoració de Halloween. Els preus els va fixar el propietari el 2026-08-11
  // sobre els costos reals: material propi de l'inventari, muntatge a 50 € l'hora
  // (el mateix que l'operari extra) i, a l'estand, el fum baix que ens lloga en
  // Tino, que aquí ja va inclòs i per tant no es torna a cobrar a part.
  { id: 'candybar-halloween', kind: 'OTHER', label: 'Candybar de Halloween', defaultPrice: 150, unit: 'unit', optional: true, defaultCost: 20 },
  // El candybar es munta amb llaminadures per a vint nens i ja van dins dels
  // 150 €: és el mínim. Només es cobren les dels nens que passin d'aquí
  // (decisió del propietari, 2026-08-12). Amb vint o menys, cap línia de més.
  { id: 'llaminadures-per-nen', kind: 'OTHER', label: 'Llaminadures del candybar · per nen', defaultPrice: 5, unit: 'unit', optional: true },
  { id: 'deco-estand-dj-halloween', kind: 'OTHER', label: 'Decoració de l’estand de DJ · Halloween', defaultPrice: 280, unit: 'unit', optional: true },
];

export function getOrbitaService(id: string): OrbitaService | undefined {
  return ORBITA_SERVICES.find((service) => service.id === id);
}
