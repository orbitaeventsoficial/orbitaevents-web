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
      },
      {
        id: 'c2', isActive: false,
        bookings: [],
      },
    ]);

    const result = await listAdminCollaborators();

    expect(result.kpis.total).toBe(2);
    expect(result.kpis.active).toBe(1);
    expect(result.kpis.totalBookings).toBe(2);
    expect(result.kpis.totalRevenue).toBe(3000);
    expect(result.kpis.totalCommissions).toBe(300);
    expect(result.kpis.pendingCommissions).toBe(100);
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
        commissionPct: 10,
        pricingModel: 'DISCOUNT',
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
});

describe('deleteAdminCollaborator', () => {
  it('elimina per id', async () => {
    const result = await deleteAdminCollaborator('c1');

    expect(result.status).toBe(200);
    expect(mockPrisma.collaborator.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
