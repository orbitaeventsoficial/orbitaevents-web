import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    collaborator: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      groupBy: vi.fn(),
    },
    booking: {
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminCollaborators,
  createAdminCollaborator,
  getAdminCollaborator,
  updateAdminCollaborator,
  deleteAdminCollaborator,
} from '@/lib/services/collaboratorAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.collaborator.findMany.mockResolvedValue([]);
  mockPrisma.collaborator.findUnique.mockResolvedValue(null);
  mockPrisma.collaborator.create.mockResolvedValue({ id: 'c1', name: 'Test' });
  mockPrisma.collaborator.update.mockResolvedValue({ id: 'c1' });
  mockPrisma.collaborator.delete.mockResolvedValue({});
  mockPrisma.lead.groupBy.mockResolvedValue([]);
  mockPrisma.booking.groupBy.mockResolvedValue([]);
});

describe('listAdminCollaborators', () => {
  it('retorna col·laboradors amb KPIs', async () => {
    mockPrisma.collaborator.findMany.mockResolvedValue([
      {
        id: 'c1', isActive: true,
        bookings: [
          { commissionAmount: 100, isPaid: false, booking: { total: 1000 } },
          { commissionAmount: 200, isPaid: true, booking: { total: 2000 } },
        ],
        products: [
          { id: 'p1', isActive: true, sellPrice: 199.99 },
          { id: 'p2', isActive: false, sellPrice: 500 },
        ],
      },
      {
        id: 'c2', isActive: false,
        bookings: [],
        products: [{ id: 'p3', isActive: true, sellPrice: 40.15 }],
      },
    ]);
    mockPrisma.lead.groupBy.mockResolvedValue([
      { sourceCollaboratorId: 'c1', _count: { _all: 2 } },
      { sourceCollaboratorId: 'c2', _count: { _all: 1 } },
    ]);
    mockPrisma.booking.groupBy.mockResolvedValue([
      { sourceCollaboratorId: 'c1', _count: { _all: 1 } },
    ]);

    const result = await listAdminCollaborators();

    expect(mockPrisma.collaborator.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: {
        products: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    expect(result.kpis.total).toBe(2);
    expect(result.kpis.active).toBe(1);
    expect(result.kpis.totalProducts).toBe(3);
    expect(result.kpis.catalogValue).toBe(240.14);
    // Comissions retirades (#1196): el cost de col·laborador va per línies de servei (+20%).
    expect(result.kpis.totalSourcedLeads).toBe(3);
    expect(result.kpis.totalSourcedBookings).toBe(1);
  });

  it('carrega el cataleg encara que falli un comptador informatiu', async () => {
    mockPrisma.collaborator.findMany.mockResolvedValue([
      {
        id: 'c1',
        isActive: true,
        products: [{ id: 'p1', isActive: true, sellPrice: 100 }],
      },
    ]);
    mockPrisma.lead.groupBy.mockResolvedValue([{ sourceCollaboratorId: 'c1', _count: { _all: 2 } }]);
    mockPrisma.booking.groupBy.mockRejectedValue(new Error('missing collaborator_bookings'));

    const result = await listAdminCollaborators();

    expect(result.collaborators).toHaveLength(1);
    expect(result.collaborators[0]._count).toEqual({ sourcedLeads: 2, sourcedBookings: 0 });
    expect(result.kpis.totalProducts).toBe(1);
  });
});

describe('createAdminCollaborator', () => {
  it('retorna 400 sense nom', async () => {
    const result = await createAdminCollaborator({ name: '' });
    expect(result.status).toBe(400);
  });

  it('crea amb defaults', async () => {
    const result = await createAdminCollaborator({ name: 'Nou Col·laborador' });

    expect(result.status).toBe(201);
    expect(mockPrisma.collaborator.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Nou Col·laborador',
        commissionPct: 0,
        pricingModel: 'DISCOUNT',
        roles: ['PROVIDER'],
      }),
    });
  });

  it('normalitza pricingModel NET_PLUS_COMMISSION', async () => {
    await createAdminCollaborator({ name: 'Test', pricingModel: 'NET_PLUS_COMMISSION' });

    expect(mockPrisma.collaborator.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ pricingModel: 'NET_PLUS_COMMISSION' }),
    });
  });

  it('fa trim dels camps', async () => {
    await createAdminCollaborator({
      name: '  Maria  ',
      company: '  Empresa SL  ',
      email: '  maria@test.com  ',
      phone: '  123456  ',
    });

    expect(mockPrisma.collaborator.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Maria',
        company: 'Empresa SL',
        email: 'maria@test.com',
        phone: '123456',
      }),
    });
  });

  it('saneja comissió i cost per hora bruts', async () => {
    await createAdminCollaborator({
      name: 'Brut',
      commissionPct: -12,
      costPerHour: 'no-num',
    });

    expect(mockPrisma.collaborator.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        commissionPct: 0,
        costPerHour: null,
      }),
    });
  });

  it('conserva decimals monetaris de comissió i cost per hora', async () => {
    await createAdminCollaborator({
      name: 'Decimal',
      commissionPct: '12.345',
      costPerHour: '45.678',
    });

    expect(mockPrisma.collaborator.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        commissionPct: 12.35,
        costPerHour: 45.68,
      }),
    });
  });
});

describe('getAdminCollaborator', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getAdminCollaborator('inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna 200 si existeix', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue({ id: 'c1', name: 'Test', bookings: [] });

    const result = await getAdminCollaborator('c1');
    expect(result.status).toBe(200);
  });
});

describe('updateAdminCollaborator', () => {
  it('actualitza camps proporcionats', async () => {
    await updateAdminCollaborator('c1', { name: ' Updated ', isActive: false });

    expect(mockPrisma.collaborator.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: expect.objectContaining({ name: 'Updated', isActive: false }),
    });
  });

  it('saneja imports numèrics en actualitzar', async () => {
    await updateAdminCollaborator('c1', { commissionPct: -4, costPerHour: Number.NaN });

    expect(mockPrisma.collaborator.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: expect.objectContaining({ commissionPct: 0, costPerHour: null }),
    });
  });
});

describe('deleteAdminCollaborator', () => {
  it('elimina per id', async () => {
    const result = await deleteAdminCollaborator('c1');

    expect(result.status).toBe(200);
    expect(mockPrisma.collaborator.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
