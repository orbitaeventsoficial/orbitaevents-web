import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { DJ_EXTRA_HOUR_PRICE, DJ_FIRST_HOUR_PRICE, djPriceForHours } from '@/lib/constants/orbita-services';

export const DOSSIER_DJ_PRODUCT_ID = 'orbita:dj-primera-hora';

export type DossierProductGroupKey = 'orbita' | 'masquerade' | 'tino' | 'altres';

export type DossierServiceLineLike = {
  collaboratorId?: string | null;
  kind?: string | null;
  label?: string | null;
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
};

export type DossierLeadServiceLinePayload = {
  collaboratorId?: string | null;
  kind: 'DJ' | 'SOUND_TECH' | 'PROVIDER_SERVICE' | 'EQUIPMENT' | 'OTHER';
  label: string;
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
  notes?: string | null;
};

export function normalizeDossierProductText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[·–—-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function dossierProductPriceValue(product: AnimacioProduct, djHours = 1): number | null {
  if (product.id === DOSSIER_DJ_PRODUCT_ID) return djPriceForHours(djHours);
  const tierPrice = product.trams?.find((tier) => tier.price !== null)?.price;
  if (typeof tierPrice === 'number') return tierPrice;
  const djPrice = product.djOptions?.find((option) => option.price !== null)?.price;
  if (typeof djPrice === 'number') return djPrice;
  if (typeof product.priceFrom === 'number') return product.priceFrom;
  return null;
}

export function dossierProductGroupKey(product: AnimacioProduct): DossierProductGroupKey {
  if (!product.id.startsWith('collab:')) return 'orbita';
  const provider = normalizeDossierProductText(product.sourceProviderName);
  if (provider.includes('tino')) return 'tino';
  if (provider.includes('masquerade') || provider.includes('carlos')) return 'masquerade';
  return 'altres';
}

export function productToDossierServiceLine(product: AnimacioProduct, djHours = 1): DossierLeadServiceLinePayload {
  const revenueAmount = dossierProductPriceValue(product, djHours);
  if (product.id === DOSSIER_DJ_PRODUCT_ID) {
    return { kind: 'DJ', label: djHours > 1 ? `DJ · ${djHours} hores` : 'DJ · primera hora', revenueAmount, quantity: 1 };
  }
  if (product.id === 'orbita:bombolles') {
    return { kind: 'EQUIPMENT', label: 'Màquina de bombolles', revenueAmount, quantity: 1 };
  }
  if (product.id === 'orbita:pont-llums-caps-mobils') {
    return { kind: 'EQUIPMENT', label: 'Pont de llums + caps mòbils', revenueAmount, quantity: 1 };
  }
  if (product.id === 'orbita:operari-extra') {
    return { kind: 'OTHER', label: 'Operari extra', revenueAmount, quantity: 1 };
  }
  const group = dossierProductGroupKey(product);
  return {
    collaboratorId: product.sourceProviderId ?? null,
    kind: group === 'tino' ? 'EQUIPMENT' : 'PROVIDER_SERVICE',
    label: product.sourceProviderName ? `${product.nom} · ${product.sourceProviderName}` : product.nom,
    revenueAmount,
    costAmount: product.sourceCostPrice ?? null,
    quantity: 1,
    notes: product.sourceProductId ? `Producte de catàleg: ${product.sourceProductId}` : null,
  };
}

function isDjExtraLabel(label: string): boolean {
  return label.includes('dj') &&
    (label.includes('hora addicional') || label.includes('hora extra') || label.includes('extra'));
}

function isDjFirstHourLabel(label: string): boolean {
  return label.includes('dj') &&
    (label.includes('1a hora') || label.includes('primera hora'));
}

export function dossierDjHoursFromServiceLines(lines: DossierServiceLineLike[]): number {
  const djRevenue = lines
    .filter((line) => line.kind === 'DJ')
    .reduce((sum, line) => sum + (line.revenueAmount ?? 0) * (line.quantity ?? 1), 0);
  if (djRevenue <= 0) return 1;
  const extras = Math.round((djRevenue - DJ_FIRST_HOUR_PRICE) / DJ_EXTRA_HOUR_PRICE);
  return Math.max(1, 1 + Math.max(0, extras));
}

export function productIdsFromDossierServiceLines(
  lines: DossierServiceLineLike[],
  products: AnimacioProduct[],
  validProductIds = new Set(products.map((product) => product.id)),
): string[] {
  const byName = new Map(products.map((product) => [normalizeDossierProductText(product.nom), product.id]));
  const ids = lines
    .map((line) => {
      const directId = line.collaboratorId
        ? (line.collaboratorId.startsWith('collab:') ? line.collaboratorId : `collab:${line.collaboratorId}`)
        : null;
      if (directId && validProductIds.has(directId)) return directId;

      const normalizedLabel = normalizeDossierProductText(line.label);
      if (line.kind === 'DJ' && (isDjExtraLabel(normalizedLabel) || isDjFirstHourLabel(normalizedLabel))) return DOSSIER_DJ_PRODUCT_ID;
      const exactName = byName.get(normalizedLabel);
      if (exactName) return exactName;

      const candidate = products
        .filter((product) => {
          const normalizedName = normalizeDossierProductText(product.nom);
          return normalizedName && (
            normalizedLabel.startsWith(normalizedName) ||
            normalizedName.startsWith(normalizedLabel)
          );
        })
        .sort((a, b) => normalizeDossierProductText(b.nom).length - normalizeDossierProductText(a.nom).length)[0];
      if (candidate) return candidate.id;

      if (line.kind === 'EQUIPMENT' && normalizedLabel.includes('caps mobils')) {
        return 'orbita:pont-llums-caps-mobils';
      }
      if (line.kind === 'DJ' && /\bdj\b/.test(normalizedLabel)) {
        return DOSSIER_DJ_PRODUCT_ID;
      }
      return null;
    })
    .filter((id): id is string => typeof id === 'string' && validProductIds.has(id));

  return Array.from(new Set(ids));
}

export function buildDossierProductsForSelection(
  products: AnimacioProduct[],
  selectedIds: Iterable<string>,
  djHours = 1,
): AnimacioProduct[] {
  const selected = new Set(selectedIds);
  return products
    .filter((product) => selected.has(product.id))
    .map((product) => (
      product.id === DOSSIER_DJ_PRODUCT_ID
        ? { ...product, priceFrom: djPriceForHours(djHours), durada: `${djHours}h` }
        : product
    ));
}
