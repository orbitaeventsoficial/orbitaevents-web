/**
 * Catàleg de productes/serveis que revèn un col·laborador.
 * costPrice = cost net que ens cobra el col·laborador; sellPrice = el nostre PVP.
 * Exporta CRUD + helper de marge derivat.
 */
import { prisma } from '@/lib/prisma';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { SOUND_RENTAL } from '@/lib/constants/inventory';

export const DOSSIER_COLLABORATOR_PRODUCT_PREFIX = 'collab:';

export type CollaboratorProductInput = {
  name?: string;
  description?: string | null;
  category?: string | null;
  crew?: string | null;
  durationLabel?: string | null;
  costPrice?: number | string | null;
  sellPrice?: number | string | null;
  imageUrl?: string | null;
  includes?: string | null;
  sortOrder?: number | string | null;
  isActive?: boolean | null;
  visibleInDossier?: boolean | null;
  visibleInBooking?: boolean | null;
};

type CollaboratorProductForDossier = {
  id: string;
  collaboratorId?: string;
  name: string;
  description: string | null;
  category: string | null;
  crew: string | null;
  durationLabel: string | null;
  costPrice: number;
  sellPrice: number;
  imageUrl: string | null;
  includes: string | null;
  sortOrder: number;
  visibleInDossier?: boolean;
  visibleInBooking?: boolean;
  collaborator: {
    name: string;
    company: string | null;
  };
};

export type DossierCollaboratorProduct = {
  id: string;
  sourceProductId: string;
  sourceProviderId?: string;
  nom: string;
  categoria?: string;
  durada?: string;
  colaborador: string;
  descripcio: string[];
  inclou: string[];
  sellPrice: number;
  costPrice: number;
  imageUrl?: string;
  dossierSortOrder?: number;
};

const DOSSIER_LEGACY_COLLABORATOR_ALIASES: ReadonlyArray<{ legacyId: string; name: string }> = [
  { legacyId: 'bingo-musical', name: 'Bingo Musical' },
  { legacyId: 'batalla-musical', name: 'Batalla Musical' },
];

const LEGACY_COLLABORATOR_ALIAS_BY_ID = new Map(
  DOSSIER_LEGACY_COLLABORATOR_ALIASES.map((alias) => [alias.legacyId, alias.name]),
);

const LEGACY_COLLABORATOR_ALIAS_BY_NAME = new Map(
  DOSSIER_LEGACY_COLLABORATOR_ALIASES.map((alias) => [alias.name.toLowerCase(), alias.legacyId]),
);

export function legacyDossierCollaboratorProductIdFor(product: Pick<DossierCollaboratorProduct, 'nom'>): string | null {
  return LEGACY_COLLABORATOR_ALIAS_BY_NAME.get(product.nom.trim().toLowerCase()) ?? null;
}

function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseNonNegativeMoney(value: number | string | null | undefined): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : null;
}

function sanitizeSortOrder(value: number | string | null | undefined): number {
  const amount = Number(value) || 0;
  return Math.max(0, Math.round(amount));
}

function splitIncludes(value?: string | null): string[] {
  return (value || '')
    .split(/·|\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isIncludedSoundRentalCatalogProduct(product: { collaboratorId?: string | null; name?: string | null }): boolean {
  const normalizedName = product.name?.toLowerCase() || '';
  return product.collaboratorId === SOUND_RENTAL.collaboratorId && /so|altaveu|speaker/.test(normalizedName);
}

/**
 * Marques/noms de prove\u00efdor que MAI poden apar\u00e8ixer al text client-facing del
 * dossier: tot es presenta com a \u00d2rbita. S'apliquen a descripcions, inclou i
 * nom de producte abans de muntar el `DossierCollaboratorProduct`, de manera que
 * tots dos renderitzadors (HTML builder + jsPDF) reben el text ja sanititzat.
 */
const PROVIDER_BRAND_PATTERNS: RegExp[] = [
  /\bmasquerade(\s+events)?\b/gi,
  /\bcarlos(\s+lucas(\s+fern[a\u00e1\u00e0]ndez)?)?\b/gi,
];

/** Elimina qualsevol menci\u00f3 de marca de prove\u00efdor d'un text client-facing. */
export function stripProviderBrand(text: string): string {
  let out = text;
  for (const pattern of PROVIDER_BRAND_PATTERNS) {
    out = out.replace(pattern, '');
  }
  // Neteja residus de puntuaci\u00f3/espais que deixa l'eliminaci\u00f3 de marca.
  return out
    .replace(/\(\s*\)/g, '')
    // Separadors "\u00b7" duplicats (marca eliminada entre dos punts volats).
    .replace(/\u00b7\s*\u00b7/g, '\u00b7')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    // "\u00b7" orfe al principi o al final (marca eliminada en un extrem).
    .replace(/^\s*\u00b7\s*/, '')
    .replace(/\s*\u00b7\s*$/, '')
    .trim();
}

function dossierProductDisplayName(product: CollaboratorProductForDossier): string {
  // El nom del catàleg ja és client-facing (es presenta com a Òrbita). La marca
  // del proveïdor es neteja amb stripProviderBrand al mapeig.
  return product.name;
}

export function toDossierCollaboratorProductId(productId: string): string {
  return `${DOSSIER_COLLABORATOR_PRODUCT_PREFIX}${productId}`;
}

export function parseDossierCollaboratorProductId(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.startsWith(DOSSIER_COLLABORATOR_PRODUCT_PREFIX)
    ? trimmed.slice(DOSSIER_COLLABORATOR_PRODUCT_PREFIX.length)
    : null;
}

export function collaboratorProductToDossierProduct(product: CollaboratorProductForDossier): DossierCollaboratorProduct {
  const collaboratorName = product.collaborator.company || product.collaborator.name;
  // Tot el text que veu el client es presenta com a Òrbita: cap marca de proveïdor.
  const includes = [
    ...(product.crew ? [product.crew] : []),
    ...splitIncludes(product.includes),
  ]
    .map(stripProviderBrand)
    .filter(Boolean);

  const description = product.description ? stripProviderBrand(product.description) : '';

  return {
    id: toDossierCollaboratorProductId(product.id),
    sourceProductId: product.id,
    sourceProviderId: product.collaboratorId,
    nom: stripProviderBrand(dossierProductDisplayName(product)),
    categoria: product.category || undefined,
    durada: product.durationLabel || undefined,
    colaborador: collaboratorName,
    descripcio: description ? [description] : ['Proposta seleccionada i gestionada per Òrbita Events.'],
    inclou: includes.length > 0 ? includes : ['Servei gestionat per Òrbita Events'],
    sellPrice: product.sellPrice,
    costPrice: product.costPrice,
    imageUrl: product.imageUrl || undefined,
    dossierSortOrder: product.sortOrder,
  };
}

export function collaboratorProductToAnimacioProduct(product: DossierCollaboratorProduct): AnimacioProduct {
  return {
    id: product.id,
    nom: product.nom,
    durada: product.durada,
    descripcio: product.descripcio,
    inclou: product.inclou,
    noInclou: 'IVA i ajustos finals segons pressupost comercial.',
    priceFrom: product.sellPrice,
    image: product.imageUrl,
    categoria: product.categoria,
    sourceProviderName: product.colaborador,
    sourceProviderId: product.sourceProviderId,
    sourceProductId: product.sourceProductId,
    sourceCostPrice: product.costPrice,
    dossierSortOrder: product.dossierSortOrder,
  };
}

export async function listCollaboratorProducts(collaboratorId: string) {
  return prisma.collaboratorProduct.findMany({
    where: { collaboratorId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function listDossierCollaboratorProducts(): Promise<DossierCollaboratorProduct[]> {
  const products = await prisma.collaboratorProduct.findMany({
    where: {
      isActive: true,
      visibleInDossier: true,
      collaborator: { isActive: true },
    },
    include: {
      collaborator: { select: { name: true, company: true } },
    },
    orderBy: [
      { collaborator: { company: 'asc' } },
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return products
    .filter((p) => !isIncludedSoundRentalCatalogProduct(p))
    .map(collaboratorProductToDossierProduct);
}

/** Productes actius de partners actius, format pla per a l'editor de línies de reserva. */
export async function listActiveCollaboratorProductsForBooking() {
  const products = await prisma.collaboratorProduct.findMany({
    where: { isActive: true, visibleInBooking: true, collaborator: { isActive: true } },
    include: { collaborator: { select: { name: true, company: true, roles: true } } },
    orderBy: [{ collaborator: { company: 'asc' } }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return products.filter((p) => !isIncludedSoundRentalCatalogProduct(p)).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    crew: p.crew,
    costPrice: p.costPrice,
    sellPrice: p.sellPrice,
    collaboratorId: p.collaboratorId,
    collaboratorName: p.collaborator.company || p.collaborator.name,
    roles: p.collaborator.roles,
    visibleInDossier: p.visibleInDossier,
    visibleInBooking: p.visibleInBooking,
  }));
}

export async function getDossierCollaboratorProductsByIds(productIds: string[]): Promise<DossierCollaboratorProduct[]> {
  const ids = productIds
    .map(parseDossierCollaboratorProductId)
    .filter((id): id is string => Boolean(id));
  const legacyNames = productIds
    .map((id) => LEGACY_COLLABORATOR_ALIAS_BY_ID.get(id))
    .filter((name): name is string => Boolean(name));
  if (ids.length === 0 && legacyNames.length === 0) return [];

  const orFilters = [
    ...(ids.length > 0 ? [{ id: { in: ids } }] : []),
    ...legacyNames.map((name) => ({ name: { equals: name, mode: 'insensitive' as const } })),
  ];

  const products = await prisma.collaboratorProduct.findMany({
    where: {
      OR: orFilters,
      isActive: true,
      visibleInDossier: true,
      collaborator: { isActive: true },
    },
    include: {
      collaborator: { select: { name: true, company: true } },
    },
  });
  const byId = new Map(products
    .filter((product) => !isIncludedSoundRentalCatalogProduct(product))
    .map((product) => [product.id, collaboratorProductToDossierProduct(product)]));
  const byLegacyId = new Map(
    Array.from(byId.values())
      .map((product) => [legacyDossierCollaboratorProductIdFor(product), product] as const)
      .filter((entry): entry is readonly [string, DossierCollaboratorProduct] => Boolean(entry[0])),
  );

  const ordered = productIds
    .map((productId) => {
      const directId = parseDossierCollaboratorProductId(productId);
      if (directId) return byId.get(directId);
      return byLegacyId.get(productId);
    })
    .filter((product): product is DossierCollaboratorProduct => Boolean(product));

  return Array.from(new Map(ordered.map((product) => [product.id, product])).values());
}

export async function createCollaboratorProduct(collaboratorId: string, input: CollaboratorProductInput) {
  if (!input.name?.trim()) {
    return { status: 400, body: { error: 'El nom del producte és obligatori' } };
  }
  const costPrice = parseNonNegativeMoney(input.costPrice);
  const sellPrice = parseNonNegativeMoney(input.sellPrice);
  if (costPrice == null) {
    return { status: 400, body: { error: 'El cost ha de ser un número positiu' } };
  }
  if (sellPrice == null) {
    return { status: 400, body: { error: 'El PVP ha de ser un número positiu' } };
  }

  const collaborator = await prisma.collaborator.findUnique({ where: { id: collaboratorId }, select: { id: true } });
  if (!collaborator) {
    return { status: 404, body: { error: 'Col·laborador no trobat' } };
  }

  const product = await prisma.collaboratorProduct.create({
    data: {
      collaboratorId,
      name: input.name.trim(),
      description: clean(input.description),
      category: clean(input.category),
      crew: clean(input.crew),
      durationLabel: clean(input.durationLabel),
      costPrice,
      sellPrice,
      imageUrl: clean(input.imageUrl),
      includes: clean(input.includes),
      sortOrder: sanitizeSortOrder(input.sortOrder),
      isActive: input.isActive ?? true,
      visibleInDossier: input.visibleInDossier ?? true,
      visibleInBooking: input.visibleInBooking ?? true,
    },
  });

  return { status: 201, body: product };
}

export async function updateCollaboratorProduct(productId: string, input: CollaboratorProductInput) {
  if (input.costPrice !== undefined && input.costPrice !== null && input.costPrice !== '') {
    if (parseNonNegativeMoney(input.costPrice) == null) {
      return { status: 400, body: { error: 'El cost ha de ser un número positiu' } };
    }
  }
  if (input.sellPrice !== undefined && input.sellPrice !== null && input.sellPrice !== '') {
    if (parseNonNegativeMoney(input.sellPrice) == null) {
      return { status: 400, body: { error: 'El PVP ha de ser un número positiu' } };
    }
  }

  const product = await prisma.collaboratorProduct.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: clean(input.description) }),
      ...(input.category !== undefined && { category: clean(input.category) }),
      ...(input.crew !== undefined && { crew: clean(input.crew) }),
      ...(input.durationLabel !== undefined && { durationLabel: clean(input.durationLabel) }),
      ...(input.costPrice !== undefined && { costPrice: parseNonNegativeMoney(input.costPrice) ?? 0 }),
      ...(input.sellPrice !== undefined && { sellPrice: parseNonNegativeMoney(input.sellPrice) ?? 0 }),
      ...(input.imageUrl !== undefined && { imageUrl: clean(input.imageUrl) }),
      ...(input.includes !== undefined && { includes: clean(input.includes) }),
      ...(input.sortOrder !== undefined && { sortOrder: sanitizeSortOrder(input.sortOrder) }),
      ...(input.isActive !== undefined && { isActive: Boolean(input.isActive) }),
      ...(input.visibleInDossier !== undefined && { visibleInDossier: Boolean(input.visibleInDossier) }),
      ...(input.visibleInBooking !== undefined && { visibleInBooking: Boolean(input.visibleInBooking) }),
    },
  });

  return { status: 200, body: product };
}

export async function deleteCollaboratorProduct(productId: string) {
  const product = await prisma.collaboratorProduct.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      isActive: true,
      visibleInDossier: true,
      visibleInBooking: true,
    },
  });
  if (!product) {
    return { status: 404, body: { error: 'Producte no trobat' } };
  }

  const dossierRef = toDossierCollaboratorProductId(productId);
  let dossierCount: number;
  try {
    dossierCount = await prisma.dossier.count({ where: { productIds: { has: dossierRef } } });
  } catch {
    return {
      status: 409,
      body: {
        error: 'No s’han pogut verificar els dossiers vinculats a aquest producte. No s’elimina res fins que la base de dades respongui correctament.',
        impact: {
          isActive: product.isActive,
          visibleInDossier: product.visibleInDossier,
          visibleInBooking: product.visibleInBooking,
          verificationFailed: ['dossierRefs'],
        },
      },
    };
  }
  if (product.isActive || dossierCount > 0) {
    return {
      status: 409,
      body: {
        error: dossierCount > 0
          ? 'Aquest producte encara apareix en dossiers guardats. Desactiva’l; no l’eliminis del tot.'
          : 'Aquest producte encara és actiu. Desactiva’l abans d’eliminar-lo.',
        impact: {
          isActive: product.isActive,
          visibleInDossier: product.visibleInDossier,
          visibleInBooking: product.visibleInBooking,
          dossierRefs: dossierCount,
        },
      },
    };
  }

  await prisma.collaboratorProduct.delete({ where: { id: productId } });
  return { status: 200, body: { ok: true } };
}
