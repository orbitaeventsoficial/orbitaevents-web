import { prisma } from '@/lib/prisma';

/**
 * Partner Hub — font única de dades de la fitxa de partner (`/admin/collaborators/[id]`).
 *
 * Paral·lel a `fetchCustomerHub` per a clients: agrega en una sola lectura tot
 * el que la fitxa operativa necessita, sense que la UI faci queries soltes.
 *
 * Tres relacions, tres significats (NO barrejar — vegeu docs/partners-platform-handoff.md):
 *   - sourcedLeads/sourcedBookings → bolos que el partner ens PASSA (`sourceCollaboratorId`).
 *   - contractedBookings (`CollaboratorBooking`) → bolos on NOSALTRES el contractem.
 *   - products (`CollaboratorProduct`) → el seu catàleg.
 */

export type PartnerHub = NonNullable<Awaited<ReturnType<typeof fetchPartnerHub>>>;

function round(value: number): number {
  return Math.round(value);
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
      bookings: {
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
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
  const serviceLinesAgg = await prisma.bookingServiceLine.aggregate({
    where: { collaboratorId: id },
    _sum: { costAmount: true },
    _count: true,
  });
  const serviceLinesPaid = round(serviceLinesAgg._sum.costAmount || 0);
  const serviceLinesCount = serviceLinesAgg._count;

  const { products, members, bookings: contractedBookings, sourcedLeads, sourcedBookings, ...core } = partner;

  const activeProducts = products.filter((product) => product.isActive);

  const economics = {
    // Bolos que ens passa
    sourcedLeadsCount: sourcedLeads.length,
    sourcedBookingsCount: sourcedBookings.length,
    sourcedRevenue: round(sourcedBookings.reduce((sum, booking) => sum + (booking.total || 0), 0)),
    // Bolos on el contractem (subcontractació)
    contractedCount: contractedBookings.length,
    contractedRevenue: round(
      contractedBookings.reduce((sum, item) => sum + (item.booking.total || 0), 0),
    ),
    totalCommissions: round(
      contractedBookings.reduce((sum, item) => sum + item.commissionAmount, 0),
    ),
    pendingCommissions: round(
      contractedBookings
        .filter((item) => !item.isPaid)
        .reduce((sum, item) => sum + item.commissionAmount, 0),
    ),
    // Catàleg
    productsCount: activeProducts.length,
    catalogValue: round(activeProducts.reduce((sum, product) => sum + (product.sellPrice || 0), 0)),
    catalogCost: round(activeProducts.reduce((sum, product) => sum + (product.costPrice || 0), 0)),
    // Quant li paguem: comissions + cost de serveis subcontractats
    serviceLinesPaid,
    serviceLinesCount,
    totalPaidToPartner: round(
      contractedBookings.reduce((sum, item) => sum + item.commissionAmount, 0) + serviceLinesPaid,
    ),
  };

  return {
    partner: core,
    members,
    sourcedLeads,
    sourcedBookings,
    contractedBookings,
    products,
    economics,
  };
}
