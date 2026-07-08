import { DJ_EXTRA_HOUR_PRICE, DJ_FIRST_HOUR_PRICE, djPriceForHours } from './orbita-services';

export type ProductPricingTier = {
  participants: string;
  team: string;
  price: number | null;
};

export type DJPricingOption = {
  label: string;
  price: number | null;
  sublabel: string;
  standalonePrice?: number | null;
  requiresFirstHour?: boolean;
};

export type AnimacioProduct = {
  id: string;
  nom: string;
  image?: string;
  descripcio: string[];
  inclou: string[];
  noInclou?: string;
  trams?: ProductPricingTier[];
  djOptions?: DJPricingOption[];
  durada?: string;
  /** Preu canònic "des de" (mínim de trams/djOptions o sellPrice del col·laborador). Mai hardcoded. */
  priceFrom?: number | null;
  /** Categoria per agrupar al dossier (DJ, Animació adulta, Animació infantil...). */
  categoria?: string;
  /** Origen comercial del producte quan ve d'un proveïdor/col·laborador. */
  sourceProviderName?: string;
  /** ID del proveïdor/col·laborador quan el producte ve de catàleg extern. */
  sourceProviderId?: string;
  /** ID del producte original quan el producte ve de catàleg extern. */
  sourceProductId?: string;
  /** Cost net del producte extern. Només per càlcul intern de marge; mai client-facing. */
  sourceCostPrice?: number;
  /** Ordre editorial dins del dossier, heretat de catàleg/proveïdor quan existeix. */
  dossierSortOrder?: number;
};

export const ANIMACIO_PRODUCT_CATEGORIES: Record<string, string> = {
  'bingo-musical': 'Animació adulta',
  'batalla-musical': 'Animació adulta',
  dj: 'DJ',
  'sonoritzacio-cerimonia': 'DJ i so per a casaments',
  'boda-sencera': 'DJ i so per a casaments',
};

/** Preu "des de" canònic d'un producte: mínim no-nul de trams o primera opció autònoma de DJ. */
export function resolveAnimacioPriceFrom(product: { trams?: readonly ProductPricingTier[]; djOptions?: readonly DJPricingOption[] }): number | null {
  const prices: number[] = [];
  for (const tram of product.trams ?? []) {
    if (typeof tram.price === 'number') prices.push(tram.price);
  }
  for (const option of product.djOptions ?? []) {
    if (option.requiresFirstHour) continue;
    if (typeof option.standalonePrice === 'number') prices.push(option.standalonePrice);
    else if (typeof option.price === 'number') prices.push(option.price);
  }
  return prices.length > 0 ? Math.min(...prices) : null;
}

/** Dades estructurals (preus, trams, opcions DJ). Textos editables via /admin/text-manager. */
export const ANIMACIO_PRODUCTS_STRUCTURE = [
  {
    id: 'bingo-musical',
    durada: '1h30',
    trams: [
      { participants: '15–60 persones', team: 'DJ + Presentador/a', price: 250 },
      { participants: '61–110 persones', team: 'DJ + Presentador/a + 1 assistent/a', price: 300 },
      { participants: '111–160 persones', team: 'DJ + Presentador/a + 2 assistents/es', price: 350 },
      { participants: '+160 persones', team: 'Pressupost a mida', price: null },
    ],
  },
  {
    id: 'batalla-musical',
    durada: '1h30',
    trams: [
      { participants: '15–60 persones', team: 'DJ + Presentador/a', price: 250 },
      { participants: '61–110 persones', team: 'DJ + Presentador/a + 1 assistent/a', price: 300 },
      { participants: '111–160 persones', team: 'DJ + Presentador/a + 2 assistents/es', price: 350 },
      { participants: '+160 persones', team: 'Pressupost a mida', price: null },
    ],
  },
  {
    id: 'dj',
    djOptions: [
      { label: '1a hora', price: DJ_FIRST_HOUR_PRICE, sublabel: 'Preu base obligatori' },
      { label: 'Hora extra', price: DJ_EXTRA_HOUR_PRICE, sublabel: 'Només després de la primera hora', requiresFirstHour: true },
      { label: '2 hores', price: djPriceForHours(2), sublabel: '1a hora + 1 hora extra' },
      { label: '3 hores', price: djPriceForHours(3), sublabel: '1a hora + 2 hores extra' },
    ] as DJPricingOption[],
  },
  {
    id: 'sonoritzacio-cerimonia',
    trams: [
      { participants: 'Cerimònia civil o religiosa', team: 'Tècnic de so + equip', price: 180 },
      { participants: 'Cerimònia + coctel (fins a 2h)', team: 'Tècnic de so + equip', price: 280 },
      { participants: 'Necessitats especials o grans espais', team: 'Pressupost a mida', price: null },
    ],
  },
  {
    id: 'boda-sencera',
    trams: [
      { participants: 'Cerimònia + coctel (3h aprox.)', team: 'Tècnic so + DJ', price: 450 },
      { participants: 'Cerimònia + coctel + festa (5–6h)', team: 'Tècnic so + DJ', price: 650 },
      { participants: 'Dia sencer (+8h)', team: 'Tècnic so + DJ', price: 950 },
      { participants: 'A mida (horaris especials, multicercle)', team: 'Pressupost personalitzat', price: null },
    ],
  },
] as const;

/** IDs en ordre de presentació */
export const ANIMACIO_PRODUCT_IDS = [
  'bingo-musical',
  'batalla-musical',
  'dj',
  'sonoritzacio-cerimonia',
  'boda-sencera',
] as const;

export type AnimacioProductId = typeof ANIMACIO_PRODUCT_IDS[number];
