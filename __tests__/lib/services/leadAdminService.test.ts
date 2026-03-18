import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      groupBy: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/constants', () => ({ PLACEHOLDER_EMAIL_DOMAIN: '@placeholder.orbita' }));

import {
  countNewAdminLeads,
  listAdminLeads,
  createAdminLead,
} from '@/lib/services/leadAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.count.mockResolvedValue(0);
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.lead.create.mockResolvedValue({ id: 'l1', name: 'Test', eventType: 'WEDDING' });
  mockPrisma.lead.groupBy.mockResolvedValue([]);
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('countNewAdminLeads', () => {
  it('retorna comptador', async () => {
    mockPrisma.lead.count.mockResolvedValue(5);

    const result = await countNewAdminLeads();

    expect(result.ok).toBe(true);
    expect(result.count).toBe(5);
  });

  it('exclou emails placeholder', async () => {
    await countNewAdminLeads();

    expect(mockPrisma.lead.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: 'NEW',
        NOT: { email: { contains: '@placeholder.orbita' } },
      }),
    });
  });
});

describe('listAdminLeads', () => {
  it('retorna estructura paginada', async () => {
    mockPrisma.lead.count.mockResolvedValue(0);

    const result = await listAdminLeads({ page: 1, limit: 20 });

    expect(result.ok).toBe(true);
    expect(result.leads).toEqual([]);
    expect(result.page).toBe(1);
  });

  it('filtra per status', async () => {
    await listAdminLeads({ page: 1, limit: 20, status: 'NEW' });

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'NEW' }),
      })
    );
  });

  it('filtra per cerca', async () => {
    await listAdminLeads({ page: 1, limit: 20, search: 'Maria' });

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });

  it('calcula stats per status', async () => {
    mockPrisma.lead.groupBy.mockResolvedValue([
      { status: 'NEW', _count: 10 },
      { status: 'WON', _count: 5 },
    ]);

    const result = await listAdminLeads({ page: 1, limit: 20 });

    expect(result.stats.NEW).toBe(10);
    expect(result.stats.WON).toBe(5);
  });

  it('aplica paginació', async () => {
    await listAdminLeads({ page: 3, limit: 10 });

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });
});

describe('createAdminLead', () => {
  it('crea lead i adminLog', async () => {
    const result = await createAdminLead({
      name: 'Maria García',
      email: 'maria@test.com',
      eventType: 'WEDDING',
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.lead.create).toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'CREATE', entity: 'lead' }),
    });
  });

  it('parseja eventDate string', async () => {
    await createAdminLead({
      name: 'Test',
      email: 'test@test.com',
      eventType: 'BIRTHDAY',
      eventDate: '2026-06-15',
    });

    expect(mockPrisma.lead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventDate: expect.any(Date),
      }),
    });
  });
});
