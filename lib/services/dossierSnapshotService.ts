// lib/services/dossierSnapshotService.ts
// Foto immutable del dossier en el moment de desar-lo. És pur i usable tant a
// client com a server: evita que un dossier antic canviï si el catàleg/preus canvien.

import type { AnimacioProduct, DJPricingOption, ProductPricingTier } from '@/lib/constants/animacio-products';

const OBSOLETE_DOSSIER_IMAGE_REPLACEMENTS = new Map<string, string>([
  ['/img/collaborators/masquerade/bingo-musical-cover.jpg', '/img/collaborators/masquerade/bingo-musical.jpg'],
]);

export type DossierProductSnapshot = Pick<
  AnimacioProduct,
  | 'id'
  | 'nom'
  | 'image'
  | 'descripcio'
  | 'inclou'
  | 'noInclou'
  | 'trams'
  | 'djOptions'
  | 'durada'
  | 'priceFrom'
  | 'categoria'
  | 'sourceProviderName'
  | 'sourceProviderId'
  | 'sourceProductId'
  | 'sourceCostPrice'
  | 'dossierSortOrder'
>;

export type DossierLineSnapshot = {
  version: 1;
  products: DossierProductSnapshot[];
  travelKm: number | null;
  travelTollsEur: number | null;
  travelLocation: string | null;
  eventDate: string | null;
};

function cleanText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function cleanTextArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(cleanText).filter((item): item is string => Boolean(item))
    : [];
}

function cleanNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 100) / 100
    : null;
}

function cleanDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function cleanPricingTiers(value: unknown): ProductPricingTier[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const tiers = value
    .map((tier) => {
      if (!tier || typeof tier !== 'object') return null;
      const raw = tier as Record<string, unknown>;
      const participants = cleanText(raw.participants);
      const team = cleanText(raw.team);
      if (!participants || !team) return null;
      return {
        participants,
        team,
        price: cleanNumber(raw.price),
      };
    })
    .filter((tier): tier is ProductPricingTier => Boolean(tier));
  return tiers.length > 0 ? tiers : undefined;
}

function cleanDjOptions(value: unknown): DJPricingOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options = value
    .map((option) => {
      if (!option || typeof option !== 'object') return null;
      const raw = option as Record<string, unknown>;
      const label = cleanText(raw.label);
      const sublabel = cleanText(raw.sublabel);
      if (!label || !sublabel) return null;
      const clean: DJPricingOption = {
        label,
        sublabel,
        price: cleanNumber(raw.price),
      };
      const standalonePrice = cleanNumber(raw.standalonePrice);
      if (standalonePrice !== null) clean.standalonePrice = standalonePrice;
      if (raw.requiresFirstHour === true) clean.requiresFirstHour = true;
      return clean;
    })
    .filter((option): option is DJPricingOption => Boolean(option));
  return options.length > 0 ? options : undefined;
}

export function snapshotProduct(product: AnimacioProduct | Record<string, unknown>): DossierProductSnapshot | null {
  const id = cleanText((product as Record<string, unknown>).id);
  const nom = cleanText((product as Record<string, unknown>).nom);
  if (!id || !nom) return null;

  const source = product as Record<string, unknown>;
  const snap: DossierProductSnapshot = {
    id,
    nom,
    descripcio: cleanTextArray(source.descripcio),
    inclou: cleanTextArray(source.inclou),
  };

  const image = cleanText(source.image);
  if (image) snap.image = image;
  const noInclou = cleanText(source.noInclou);
  if (noInclou) snap.noInclou = noInclou;
  const trams = cleanPricingTiers(source.trams);
  if (trams) snap.trams = trams;
  const djOptions = cleanDjOptions(source.djOptions);
  if (djOptions) snap.djOptions = djOptions;
  const durada = cleanText(source.durada);
  if (durada) snap.durada = durada;
  const priceFrom = cleanNumber(source.priceFrom);
  if (priceFrom !== null) snap.priceFrom = priceFrom;
  const categoria = cleanText(source.categoria);
  if (categoria) snap.categoria = categoria;
  const sourceProviderName = cleanText(source.sourceProviderName);
  if (sourceProviderName) snap.sourceProviderName = sourceProviderName;
  const sourceProviderId = cleanText(source.sourceProviderId);
  if (sourceProviderId) snap.sourceProviderId = sourceProviderId;
  const sourceProductId = cleanText(source.sourceProductId);
  if (sourceProductId) snap.sourceProductId = sourceProductId;
  const sourceCostPrice = cleanNumber(source.sourceCostPrice);
  if (sourceCostPrice !== null) snap.sourceCostPrice = sourceCostPrice;
  const dossierSortOrder = cleanNumber(source.dossierSortOrder);
  if (dossierSortOrder !== null) snap.dossierSortOrder = dossierSortOrder;
  return snap;
}

export function buildDossierLineSnapshot(input: {
  products: AnimacioProduct[];
  travelKm?: number | null;
  travelTollsEur?: number | null;
  travelLocation?: string | null;
  eventDate?: Date | string | null;
}): DossierLineSnapshot {
  return {
    version: 1,
    products: input.products
      .map((product) => snapshotProduct(product))
      .filter((product): product is DossierProductSnapshot => Boolean(product)),
    travelKm: cleanNumber(input.travelKm),
    travelTollsEur: cleanNumber(input.travelTollsEur),
    travelLocation: cleanText(input.travelLocation) ?? null,
    eventDate: cleanDate(input.eventDate),
  };
}

export function parseDossierLineSnapshot(value: unknown): DossierLineSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || !Array.isArray(raw.products)) return null;
  const products = raw.products
    .map((product) => snapshotProduct(product as Record<string, unknown>))
    .filter((product): product is DossierProductSnapshot => Boolean(product));
  if (products.length === 0) return null;
  return {
    version: 1,
    products,
    travelKm: cleanNumber(raw.travelKm),
    travelTollsEur: cleanNumber(raw.travelTollsEur),
    travelLocation: cleanText(raw.travelLocation) ?? null,
    eventDate: cleanDate(raw.eventDate),
  };
}

export function productsFromDossierLineSnapshot(value: unknown): AnimacioProduct[] | null {
  return parseDossierLineSnapshot(value)?.products ?? null;
}

export function hydrateDossierSnapshotProductImages(
  snapshotProducts: AnimacioProduct[] | null | undefined,
  catalogProducts: readonly AnimacioProduct[],
): AnimacioProduct[] | null {
  if (!snapshotProducts) return null;
  const byId = new Map(catalogProducts.map((product) => [product.id, product]));
  const bySourceProductId = new Map(
    catalogProducts
      .filter((product) => product.sourceProductId)
      .map((product) => [product.sourceProductId as string, product]),
  );

  return snapshotProducts.map((product) => {
    const replacement = product.image ? OBSOLETE_DOSSIER_IMAGE_REPLACEMENTS.get(product.image) : undefined;
    if (replacement) return { ...product, image: replacement };
    if (product.image) return product;
    const liveProduct = byId.get(product.id) ?? (
      product.sourceProductId ? bySourceProductId.get(product.sourceProductId) : undefined
    );
    return liveProduct?.image ? { ...product, image: liveProduct.image } : product;
  });
}

export function transportFromDossierLineSnapshot(value: unknown): { travelKm?: number; travelTollsEur?: number; travelLocation?: string; eventDate?: string } {
  const snapshot = parseDossierLineSnapshot(value);
  if (!snapshot) return {};
  return {
    travelKm: snapshot.travelKm ?? undefined,
    travelTollsEur: snapshot.travelTollsEur ?? undefined,
    travelLocation: snapshot.travelLocation ?? undefined,
    eventDate: snapshot.eventDate ?? undefined,
  };
}
