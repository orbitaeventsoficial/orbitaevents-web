import { CollaboratorPricingModel } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type CollaboratorInput = {
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  roles?: string[] | null;
  commissionPct?: number | string | null;
  pricingModel?: string | null;
  costPerHour?: number | string | null;
  notes?: string | null;
  isActive?: boolean | null;
  isFavorite?: boolean | null;
};

function normalizePricingModel(value?: string | null): CollaboratorPricingModel {
  return value === 'NET_PLUS_COMMISSION' ? 'NET_PLUS_COMMISSION' : 'DISCOUNT';
}

export async function listAdminCollaborators() {
  const collaborators = await prisma.collaborator.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      products: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      _count: {
        select: {
          sourcedLeads: true,
          sourcedBookings: true,
        },
      },
    },
  });

  const allProducts = collaborators.flatMap((collaborator) => collaborator.products || []);
  const catalogValue = allProducts
    .filter((product) => product.isActive)
    .reduce((sum, product) => sum + (product.sellPrice || 0), 0);
  const totalSourcedLeads = collaborators.reduce((sum, collaborator) => sum + (collaborator._count?.sourcedLeads || 0), 0);
  const totalSourcedBookings = collaborators.reduce((sum, collaborator) => sum + (collaborator._count?.sourcedBookings || 0), 0);

  return {
    collaborators,
    kpis: {
      total: collaborators.length,
      active: collaborators.filter((collaborator) => collaborator.isActive).length,
      totalProducts: allProducts.length,
      catalogValue: Math.round(catalogValue),
      totalSourcedLeads,
      totalSourcedBookings,
    },
  };
}

export async function createAdminCollaborator(input: CollaboratorInput) {
  if (!input.name?.trim()) {
    return { status: 400, body: { error: 'El nom és obligatori' } };
  }

  const collaborator = await prisma.collaborator.create({
    data: {
      name: input.name.trim(),
      company: input.company?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      specialty: input.specialty?.trim() || null,
      roles: Array.isArray(input.roles) && input.roles.length > 0 ? input.roles : ['PROVIDER'],
      commissionPct: Number(input.commissionPct) || 0,
      pricingModel: normalizePricingModel(input.pricingModel),
      costPerHour: input.costPerHour != null ? Number(input.costPerHour) : null,
      notes: input.notes?.trim() || null,
    },
  });

  return { status: 201, body: collaborator };
}

export async function getAdminCollaborator(id: string) {
  const collaborator = await prisma.collaborator.findUnique({
    where: { id },
  });

  if (!collaborator) {
    return { status: 404, body: { error: 'No trobat' } };
  }

  return { status: 200, body: collaborator };
}

export async function updateAdminCollaborator(id: string, input: CollaboratorInput) {
  const collaborator = await prisma.collaborator.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.company !== undefined && { company: input.company?.trim() || null }),
      ...(input.email !== undefined && { email: input.email?.trim() || null }),
      ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
      ...(input.specialty !== undefined && { specialty: input.specialty?.trim() || null }),
      ...(input.roles !== undefined && { roles: Array.isArray(input.roles) && input.roles.length > 0 ? input.roles : [] }),
      ...(input.commissionPct !== undefined && { commissionPct: Number(input.commissionPct) }),
      ...(input.pricingModel !== undefined && { pricingModel: normalizePricingModel(input.pricingModel) }),
      ...(input.costPerHour !== undefined && { costPerHour: input.costPerHour != null ? Number(input.costPerHour) : null }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      ...(input.isActive !== undefined && { isActive: Boolean(input.isActive) }),
      ...(input.isFavorite !== undefined && { isFavorite: Boolean(input.isFavorite) }),
    },
  });

  return { status: 200, body: collaborator };
}

export async function deleteAdminCollaborator(id: string) {
  await prisma.collaborator.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}
