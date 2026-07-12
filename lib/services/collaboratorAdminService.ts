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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sanitizeCommissionPct(value: CollaboratorInput['commissionPct']): number {
  const amount = Number(value) || 0;
  return amount > 0 ? roundMoney(amount) : 0;
}

function sanitizeCostPerHour(value: CollaboratorInput['costPerHour']): number | null {
  if (value == null || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : null;
}

function rowsToSourceCollaboratorCountMap(
  rows: Array<{ sourceCollaboratorId: string | null; _count: { _all: number } }>,
): Map<string, number> {
  return new Map(
    rows
      .filter((row) => row.sourceCollaboratorId)
      .map((row) => [row.sourceCollaboratorId as string, row._count._all]),
  );
}

async function countLeadsBySourceCollaborator(): Promise<Map<string, number>> {
  try {
    const rows = await prisma.lead.groupBy({
      by: ['sourceCollaboratorId'],
      where: { sourceCollaboratorId: { not: null } },
      _count: { _all: true },
    });
    return rowsToSourceCollaboratorCountMap(rows);
  } catch {
    // Els comptadors son informatius: mai han de bloquejar carregar proveidors/productes.
    return new Map();
  }
}

async function countBookingsBySourceCollaborator(): Promise<Map<string, number>> {
  try {
    const rows = await prisma.booking.groupBy({
      by: ['sourceCollaboratorId'],
      where: { sourceCollaboratorId: { not: null } },
      _count: { _all: true },
    });
    return rowsToSourceCollaboratorCountMap(rows);
  } catch {
    // Els comptadors son informatius: mai han de bloquejar carregar proveidors/productes.
    return new Map();
  }
}

async function safeDeleteDependencyCount(label: string, count: Promise<number>): Promise<{ label: string; count: number | null }> {
  try {
    return { label, count: await count };
  } catch {
    return { label, count: null };
  }
}

export async function listAdminCollaborators() {
  const rawCollaborators = await prisma.collaborator.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      products: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  const [sourcedLeadCounts, sourcedBookingCounts] = await Promise.all([
    countLeadsBySourceCollaborator(),
    countBookingsBySourceCollaborator(),
  ]);

  const collaborators = rawCollaborators.map((collaborator) => ({
    ...collaborator,
    _count: {
      sourcedLeads: sourcedLeadCounts.get(collaborator.id) || 0,
      sourcedBookings: sourcedBookingCounts.get(collaborator.id) || 0,
    },
  }));

  const allProducts = collaborators.flatMap((collaborator) => collaborator.products || []);
  const activeProducts = allProducts.filter((product) => product.isActive);
  const catalogValue = activeProducts
    .reduce((sum, product) => sum + (product.sellPrice || 0), 0);
  const totalSourcedLeads = collaborators.reduce((sum, collaborator) => sum + (collaborator._count?.sourcedLeads || 0), 0);
  const totalSourcedBookings = collaborators.reduce((sum, collaborator) => sum + (collaborator._count?.sourcedBookings || 0), 0);

  return {
    collaborators,
    kpis: {
      total: collaborators.length,
      active: collaborators.filter((collaborator) => collaborator.isActive).length,
      totalProducts: activeProducts.length,
      catalogValue: roundMoney(catalogValue),
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
      commissionPct: sanitizeCommissionPct(input.commissionPct),
      pricingModel: normalizePricingModel(input.pricingModel),
      costPerHour: sanitizeCostPerHour(input.costPerHour),
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
      ...(input.commissionPct !== undefined && { commissionPct: sanitizeCommissionPct(input.commissionPct) }),
      ...(input.pricingModel !== undefined && { pricingModel: normalizePricingModel(input.pricingModel) }),
      ...(input.costPerHour !== undefined && { costPerHour: sanitizeCostPerHour(input.costPerHour) }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      ...(input.isActive !== undefined && { isActive: Boolean(input.isActive) }),
      ...(input.isFavorite !== undefined && { isFavorite: Boolean(input.isFavorite) }),
    },
  });

  return { status: 200, body: collaborator };
}

export async function deleteAdminCollaborator(id: string) {
  const collaborator = await prisma.collaborator.findUnique({
    where: { id },
    include: { _count: { select: { products: true, members: true } } },
  });
  if (!collaborator) {
    return { status: 404, body: { error: 'No trobat' } };
  }

  const countRows = await Promise.all([
    safeDeleteDependencyCount('sourcedLeads', prisma.lead.count({ where: { sourceCollaboratorId: id } })),
    safeDeleteDependencyCount('sourceBookings', prisma.booking.count({ where: { sourceCollaboratorId: id } })),
    safeDeleteDependencyCount('billedBookings', prisma.booking.count({ where: { billedCollaboratorId: id } })),
    safeDeleteDependencyCount('leadServiceLines', prisma.leadServiceLine.count({ where: { collaboratorId: id } })),
    safeDeleteDependencyCount('bookingServiceLines', prisma.bookingServiceLine.count({ where: { collaboratorId: id } })),
    safeDeleteDependencyCount('payments', prisma.collaboratorPayment.count({ where: { collaboratorId: id } })),
    safeDeleteDependencyCount('crewBlocks', prisma.crewBlock.count({ where: { collaboratorId: id } })),
  ]);
  const verificationFailed = countRows.filter((row) => row.count === null).map((row) => row.label);
  if (verificationFailed.length > 0) {
    return {
      status: 409,
      body: {
        error: 'No s’han pogut verificar totes les vinculacions del col·laborador. No s’elimina res fins que la base de dades respongui correctament.',
        impact: { verificationFailed },
      },
    };
  }
  const counts = new Map(countRows.map((row) => [row.label, row.count ?? 0]));
  const impact = {
    products: collaborator._count.products,
    members: collaborator._count.members,
    sourcedLeads: counts.get('sourcedLeads') ?? 0,
    sourceBookings: counts.get('sourceBookings') ?? 0,
    billedBookings: counts.get('billedBookings') ?? 0,
    leadServiceLines: counts.get('leadServiceLines') ?? 0,
    bookingServiceLines: counts.get('bookingServiceLines') ?? 0,
    payments: counts.get('payments') ?? 0,
    crewBlocks: counts.get('crewBlocks') ?? 0,
  };
  const hasImpact = Object.values(impact).some((count) => count > 0);
  if (hasImpact) {
    return {
      status: 409,
      body: {
        error: 'Aquest col·laborador té dades vinculades. Desactiva’l en lloc d’eliminar-lo, o neteja primer les vinculacions.',
        impact,
      },
    };
  }

  await prisma.collaborator.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}
