import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchPartnerHub } from '@/lib/services/partnerHubService';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: { collaborator: { findUnique: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

function buildPartner(overrides: Record<string, unknown> = {}) {
  return {
    id: 'col_1',
    name: 'Masquerade',
    company: 'Masquerade Events',
    roles: ['PROVIDER', 'REFERRER'],
    isActive: true,
    products: [
      { id: 'p1', sellPrice: 200, costPrice: 160, isActive: true },
      { id: 'p2', sellPrice: 50, costPrice: 40, isActive: false }, // inactiu: no compta
    ],
    bookings: [
      { id: 'cb1', commissionAmount: 40, isPaid: true, booking: { id: 'b1', total: 340, reference: 'OE-1', clientName: 'X', eventDate: null, status: 'CONFIRMED' } },
      { id: 'cb2', commissionAmount: 60, isPaid: false, booking: { id: 'b2', total: 500, reference: 'OE-2', clientName: 'Y', eventDate: null, status: 'PENDING' } },
    ],
    sourcedLeads: [
      { id: 'l1', name: 'Sant Joan', eventType: 'PRIVATE_PARTY', eventDate: null, status: 'WON', budget: null, createdAt: new Date() },
    ],
    sourcedBookings: [
      { id: 'sb1', reference: 'OE-3', clientName: 'Z', eventDate: null, status: 'CONFIRMED', total: 800 },
      { id: 'sb2', reference: 'OE-4', clientName: 'W', eventDate: null, status: 'COMPLETED', total: 200 },
    ],
    ...overrides,
  };
}

describe('fetchPartnerHub', () => {
  beforeEach(() => {
    mockPrisma.collaborator.findUnique.mockReset();
  });

  it('retorna null si el partner no existeix', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(null);
    expect(await fetchPartnerHub('missing')).toBeNull();
  });

  it('separa els tres conceptes i calcula economia agregada', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(buildPartner());
    const hub = await fetchPartnerHub('col_1');

    expect(hub).not.toBeNull();
    expect(hub!.partner.name).toBe('Masquerade');
    // El nucli no arrossega les col·leccions
    expect(hub!.partner).not.toHaveProperty('products');
    expect(hub!.partner).not.toHaveProperty('bookings');

    expect(hub!.sourcedLeads).toHaveLength(1);
    expect(hub!.sourcedBookings).toHaveLength(2);
    expect(hub!.contractedBookings).toHaveLength(2);
    expect(hub!.products).toHaveLength(2);

    const e = hub!.economics;
    expect(e.sourcedLeadsCount).toBe(1);
    expect(e.sourcedBookingsCount).toBe(2);
    expect(e.sourcedRevenue).toBe(1000); // 800 + 200
    expect(e.contractedCount).toBe(2);
    expect(e.contractedRevenue).toBe(840); // 340 + 500
    expect(e.totalCommissions).toBe(100); // 40 + 60
    expect(e.pendingCommissions).toBe(60); // només cb2 no pagat
    expect(e.productsCount).toBe(1); // només p1 actiu
    expect(e.catalogValue).toBe(200); // sellPrice del p1
    expect(e.catalogCost).toBe(160); // costPrice del p1
  });

  it('gestiona partner sense relacions (empty state)', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(
      buildPartner({ products: [], bookings: [], sourcedLeads: [], sourcedBookings: [] }),
    );
    const hub = await fetchPartnerHub('col_1');
    const e = hub!.economics;
    expect(e.sourcedRevenue).toBe(0);
    expect(e.totalCommissions).toBe(0);
    expect(e.pendingCommissions).toBe(0);
    expect(e.catalogValue).toBe(0);
    expect(e.productsCount).toBe(0);
  });
});
