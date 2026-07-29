import { prisma } from '@/lib/prisma';

/**
 * Partner Hub — font única de dades de la fitxa de partner (`/admin/collaborators/[id]`).
 *
 * Paral·lel a `fetchCustomerHub` per a clients: agrega en una sola lectura tot
 * el que la fitxa operativa necessita, sense que la UI faci queries soltes.
 *
 * Relacions (NO barrejar — vegeu docs/partners-platform-handoff.md):
 *   - sourcedLeads/sourcedBookings → bolos que el partner ens PASSA (`sourceCollaboratorId`).
 *   - products (`CollaboratorProduct`) → el seu catàleg.
 * Quan NOSALTRES el subcontractem, el cost va per línies de servei (BookingServiceLine
 * amb collaboratorId, preu de venda = cost +20%). El sistema de comissions
 * (CollaboratorBooking) es va retirar al #1196.
 */

export type PartnerHub = NonNullable<Awaited<ReturnType<typeof fetchPartnerHub>>>;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function fetchPartnerHub(id: string) {
  const partner = await prisma.collaborator.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      members: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      sourcedLeads: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          eventType: true,
          eventDate: true,
          status: true,
          budget: true,
          createdAt: true,
        },
      },
      sourcedBookings: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reference: true,
          clientName: true,
          eventDate: true,
          status: true,
          total: true,
        },
      },
    },
  });

  if (!partner) return null;

  // Cost que paguem al partner via línies de servei (subcontractació nova).
  const serviceLines = await prisma.bookingServiceLine.findMany({
    where: { collaboratorId: id },
    select: { costAmount: true, quantity: true },
  });
  const serviceLinesPaid = round(
    serviceLines.reduce((sum, line) => sum + (line.costAmount || 0) * (line.quantity || 1), 0)
  );
  const serviceLinesCount = serviceLines.length;

  const { products, members, sourcedLeads, sourcedBookings, ...core } = partner;

  const activeProducts = products.filter((product) => product.isActive);

  const economics = {
    // Bolos que ens passa
    sourcedLeadsCount: sourcedLeads.length,
    sourcedBookingsCount: sourcedBookings.length,
    sourcedRevenue: round(sourcedBookings.reduce((sum, booking) => sum + (booking.total || 0), 0)),
    // Catàleg
    productsCount: activeProducts.length,
    catalogValue: round(activeProducts.reduce((sum, product) => sum + (product.sellPrice || 0), 0)),
    catalogCost: round(activeProducts.reduce((sum, product) => sum + (product.costPrice || 0), 0)),
    // Quant li paguem: cost de serveis subcontractats (línies de servei, +20%).
    serviceLinesPaid,
    serviceLinesCount,
    totalPaidToPartner: serviceLinesPaid,
  };

  return {
    partner: core,
    members,
    sourcedLeads,
    sourcedBookings,
    products,
    economics,
  };
}
