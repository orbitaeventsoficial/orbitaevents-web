import 'server-only';

import { getOrbitaDossierProducts } from '@/lib/constants/dossier-copy';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { prisma } from '@/lib/prisma';
import {
  collaboratorProductToAnimacioProduct,
  listDossierCollaboratorProducts,
} from '@/lib/services/collaboratorProductService';
import { createDossier, getDossierLeadInitialData, type CreateDossierInput, type DossierLeadInitialData } from '@/lib/services/dossierService';
import { buildDossierLineSnapshot } from '@/lib/services/dossierSnapshotService';
import {
  buildDossierProductsForSelection,
  dossierDjHoursFromServiceLines,
  productIdsFromDossierServiceLines,
  type DossierServiceLineLike,
} from '@/lib/services/dossierProductMappingService';

export type ComposeDossierDraftResult =
  | {
      ok: true;
      input: CreateDossierInput;
      productIds: string[];
      productNames: string[];
      djHours: number;
    }
  | { ok: false; error: string };

export type CreateDossierDraftFromLeadResult =
  | {
      ok: true;
      status: 'created' | 'existing';
      dossierId: string;
      productIds: string[];
      productNames: string[];
    }
  | { ok: false; error: string };

export function composeDossierDraftFromLead(input: {
  lead: DossierLeadInitialData;
  serviceLines: DossierServiceLineLike[];
  products: AnimacioProduct[];
}): ComposeDossierDraftResult {
  const productIds = productIdsFromDossierServiceLines(input.serviceLines, input.products);
  if (productIds.length === 0) {
    return { ok: false, error: 'El lead no té línies de bolo mapejables al catàleg del dossier.' };
  }

  const djHours = dossierDjHoursFromServiceLines(input.serviceLines);
  const dossierProducts = buildDossierProductsForSelection(input.products, productIds, djHours);
  if (dossierProducts.length === 0) {
    return { ok: false, error: 'No s’ha pogut construir cap producte de dossier per a aquest lead.' };
  }

  const snapshot = buildDossierLineSnapshot({
    products: dossierProducts,
    travelKm: input.lead.distanceKm,
    travelTollsEur: input.lead.tollsEur,
    travelLocation: input.lead.travelLocation,
  });

  return {
    ok: true,
    input: {
      leadId: input.lead.id,
      nom: input.lead.nom,
      telefon: input.lead.telefon,
      email: input.lead.email,
      eventDesc: input.lead.eventDesc,
      productIds,
      lineSnapshot: snapshot,
      mode: 'DRAFT',
    },
    productIds,
    productNames: dossierProducts.map((product) => product.nom),
    djHours,
  };
}

export async function createDossierDraftFromLead(leadId: string): Promise<CreateDossierDraftFromLeadResult> {
  const trimmedLeadId = leadId.trim();
  if (!trimmedLeadId) return { ok: false, error: 'Lead requerit' };

  const existing = await prisma.dossier.findFirst({
    where: { leadId: trimmedLeadId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, productIds: true },
  });
  if (existing) {
    return {
      ok: true,
      status: 'existing',
      dossierId: existing.id,
      productIds: existing.productIds,
      productNames: [],
    };
  }

  const lead = await getDossierLeadInitialData(trimmedLeadId);
  if (!lead) return { ok: false, error: 'Lead no trobat' };

  const [serviceLines, orbitaProducts, collaboratorProducts] = await Promise.all([
    prisma.leadServiceLine.findMany({
      where: { leadId: trimmedLeadId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        collaboratorId: true,
        kind: true,
        label: true,
        revenueAmount: true,
        costAmount: true,
        quantity: true,
      },
    }),
    getOrbitaDossierProducts('ca'),
    listDossierCollaboratorProducts(),
  ]);

  const products = [
    ...orbitaProducts,
    ...collaboratorProducts.map(collaboratorProductToAnimacioProduct),
  ];
  const composed = composeDossierDraftFromLead({ lead, serviceLines, products });
  if (!composed.ok) return composed;

  const dossier = await createDossier(composed.input);
  return {
    ok: true,
    status: 'created',
    dossierId: dossier.id,
    productIds: composed.productIds,
    productNames: composed.productNames,
  };
}
