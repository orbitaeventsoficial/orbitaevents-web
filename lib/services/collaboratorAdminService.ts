import { CollaboratorPricingModel } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type CollaboratorInput = {
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  commissionPct?: number | string | null;
  pricingModel?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
};

function normalizePricingModel(value?: string | null): CollaboratorPricingModel {
  return value === 'NET_PLUS_COMMISSION' ? 'NET_PLUS_COMMISSION' : 'DISCOUNT';
}

export async function listAdminCollaborators() {
  const collaborators = await prisma.collaborator.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      bookings: {
        include: {
          booking: {
            select: {
              id: true,
              reference: true,
              clientName: true,
              total: true,
              eventDate: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const allBookings = collaborators.flatMap((collaborator) => collaborator.bookings);
  const totalCommissions = allBookings.reduce((sum, collaboratorBooking) => sum + collaboratorBooking.commissionAmount, 0);
  const totalRevenue = allBookings.reduce((sum, collaboratorBooking) => sum + (collaboratorBooking.booking.total || 0), 0);
  const pendingCommissions = allBookings
    .filter((collaboratorBooking) => !collaboratorBooking.isPaid)
    .reduce((sum, collaboratorBooking) => sum + collaboratorBooking.commissionAmount, 0);

  return {
    collaborators,
    kpis: {
      total: collaborators.length,
      active: collaborators.filter((collaborator) => collaborator.isActive).length,
      totalBookings: allBookings.length,
      totalRevenue: Math.round(totalRevenue),
      totalCommissions: Math.round(totalCommissions),
      pendingCommissions: Math.round(pendingCommissions),
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
      commissionPct: Number(input.commissionPct) || 10,
      pricingModel: normalizePricingModel(input.pricingModel),
      notes: input.notes?.trim() || null,
    },
  });

  return { status: 201, body: collaborator };
}

export async function getAdminCollaborator(id: string) {
  const collaborator = await prisma.collaborator.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          booking: {
            select: {
              id: true,
              reference: true,
              clientName: true,
              total: true,
              eventDate: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
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
      ...(input.commissionPct !== undefined && { commissionPct: Number(input.commissionPct) }),
      ...(input.pricingModel !== undefined && { pricingModel: normalizePricingModel(input.pricingModel) }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      ...(input.isActive !== undefined && { isActive: Boolean(input.isActive) }),
    },
  });

  return { status: 200, body: collaborator };
}

export async function deleteAdminCollaborator(id: string) {
  await prisma.collaborator.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}
