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
};

/** Preu "des de" canònic d'un producte: mínim no-nul de trams o djOptions. */
export function resolveAnimacioPriceFrom(product: { trams?: readonly ProductPricingTier[]; djOptions?: readonly DJPricingOption[] }): number | null {
  const prices: number[] = [];
  for (const tram of product.trams ?? []) {
    if (typeof tram.price === 'number') prices.push(tram.price);
  }
  for (const option of product.djOptions ?? []) {
    if (typeof option.price === 'number') prices.push(option.price);
    if (typeof option.standalonePrice === 'number') prices.push(option.standalonePrice);
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
      { label: '1 hora', price: 100, sublabel: 'En pack amb animació', standalonePrice: 150 },
      { label: '2 hores', price: 200, sublabel: 'En pack amb animació', standalonePrice: 250 },
      { label: '3 hores', price: null, sublabel: 'Pressupost a mida' },
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
