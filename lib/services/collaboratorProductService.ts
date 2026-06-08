/**
 * Catàleg de productes/serveis que revèn un col·laborador.
 * costPrice = cost net que ens cobra el col·laborador; sellPrice = el nostre PVP.
 * Exporta CRUD + helper de marge derivat.
 */
import { prisma } from '@/lib/prisma';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';

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
};

type CollaboratorProductForDossier = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  crew: string | null;
  durationLabel: string | null;
  sellPrice: number;
  imageUrl: string | null;
  includes: string | null;
  sortOrder: number;
  collaborator: {
    name: string;
    company: string | null;
  };
};

export type DossierCollaboratorProduct = {
  id: string;
  sourceProductId: string;
  nom: string;
  categoria?: string;
  durada?: string;
  colaborador: string;
  descripcio: string[];
  inclou: string[];
  sellPrice: number;
  imageUrl?: string;
};

/** Profit net (€) i markup d'un producte. % calculat sobre el cost del col·laborador. */
export function computeProductMargin(costPrice: number, sellPrice: number) {
  const marginNet = sellPrice - costPrice;
  const marginPct = costPrice > 0 ? (marginNet / costPrice) * 100 : 0;
  return { marginNet, marginPct };
}

function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function splitIncludes(value?: string | null): string[] {
  return (value || '')
    .split(/·|\n|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
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
  const includes = [
    ...(product.crew ? [product.crew] : []),
    ...splitIncludes(product.includes),
  ];

  return {
    id: toDossierCollaboratorProductId(product.id),
    sourceProductId: product.id,
    nom: product.name,
    categoria: product.category || undefined,
    durada: product.durationLabel || undefined,
    colaborador: collaboratorName,
    descripcio: product.description ? [product.description] : [`Proposta de col·laborador gestionada per ${collaboratorName}.`],
    inclou: includes.length > 0 ? includes : ['Servei gestionat per col·laborador homologat'],
    sellPrice: product.sellPrice,
    imageUrl: product.imageUrl || undefined,
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

  return products.map(collaboratorProductToDossierProduct);
}

/** Productes actius de partners actius, format pla per a l'editor de línies de reserva. */
export async function listActiveCollaboratorProductsForBooking() {
  const products = await prisma.collaboratorProduct.findMany({
    where: { isActive: true, collaborator: { isActive: true } },
    include: { collaborator: { select: { name: true, company: true } } },
    orderBy: [{ collaborator: { company: 'asc' } }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    costPrice: p.costPrice,
    sellPrice: p.sellPrice,
    collaboratorId: p.collaboratorId,
    collaboratorName: p.collaborator.company || p.collaborator.name,
  }));
}

export async function getDossierCollaboratorProductsByIds(productIds: string[]): Promise<DossierCollaboratorProduct[]> {
  const ids = productIds
    .map(parseDossierCollaboratorProductId)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const products = await prisma.collaboratorProduct.findMany({
    where: {
      id: { in: ids },
      isActive: true,
      collaborator: { isActive: true },
    },
    include: {
      collaborator: { select: { name: true, company: true } },
    },
  });
  const byId = new Map(products.map((product) => [product.id, collaboratorProductToDossierProduct(product)]));

  return ids
    .map((id) => byId.get(id))
    .filter((product): product is DossierCollaboratorProduct => Boolean(product));
}

export async function createCollaboratorProduct(collaboratorId: string, input: CollaboratorProductInput) {
  if (!input.name?.trim()) {
    return { status: 400, body: { error: 'El nom del producte és obligatori' } };
  }
  const costPrice = Number(input.costPrice);
  const sellPrice = Number(input.sellPrice);
  if (!Number.isFinite(costPrice) || costPrice < 0) {
    return { status: 400, body: { error: 'El cost ha de ser un número positiu' } };
  }
  if (!Number.isFinite(sellPrice) || sellPrice < 0) {
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
      sortOrder: Number(input.sortOrder) || 0,
    },
  });

  return { status: 201, body: product };
}

export async function updateCollaboratorProduct(productId: string, input: CollaboratorProductInput) {
  if (input.costPrice !== undefined && input.costPrice !== null && input.costPrice !== '') {
    const costPrice = Number(input.costPrice);
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      return { status: 400, body: { error: 'El cost ha de ser un número positiu' } };
    }
  }
  if (input.sellPrice !== undefined && input.sellPrice !== null && input.sellPrice !== '') {
    const sellPrice = Number(input.sellPrice);
    if (!Number.isFinite(sellPrice) || sellPrice < 0) {
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
      ...(input.costPrice !== undefined && { costPrice: Number(input.costPrice) }),
      ...(input.sellPrice !== undefined && { sellPrice: Number(input.sellPrice) }),
      ...(input.imageUrl !== undefined && { imageUrl: clean(input.imageUrl) }),
      ...(input.includes !== undefined && { includes: clean(input.includes) }),
      ...(input.sortOrder !== undefined && { sortOrder: Number(input.sortOrder) || 0 }),
      ...(input.isActive !== undefined && { isActive: Boolean(input.isActive) }),
    },
  });

  return { status: 200, body: product };
}

export async function deleteCollaboratorProduct(productId: string) {
  await prisma.collaboratorProduct.delete({ where: { id: productId } });
  return { status: 200, body: { ok: true } };
}
