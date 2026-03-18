import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    availability: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listBlockedAvailability,
  blockAvailabilityDay,
  unblockAvailabilityDay,
} from '@/lib/services/availabilityAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.availability.findMany.mockResolvedValue([]);
  mockPrisma.availability.findUnique.mockResolvedValue(null);
  mockPrisma.availability.create.mockResolvedValue({ id: 'avail-1' });
  mockPrisma.availability.update.mockResolvedValue({ id: 'avail-1' });
  mockPrisma.availability.delete.mockResolvedValue({});
  mockPrisma.availability.deleteMany.mockResolvedValue({ count: 1 });
});

describe('listBlockedAvailability', () => {
  it('retorna dies bloquejats', async () => {
    mockPrisma.availability.findMany.mockResolvedValue([{ id: 'a1', date: new Date(), status: 'BLOCKED' }]);

    const result = await listBlockedAvailability();

    expect(result.ok).toBe(true);
    expect(result.blocked).toHaveLength(1);
  });

  it('filtra per rang de dates si proporcionat', async () => {
    await listBlockedAvailability('2026-09-01', '2026-09-30');

    expect(mockPrisma.availability.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'BLOCKED',
          date: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });
});

describe('blockAvailabilityDay', () => {
  it('retorna 400 sense data', async () => {
    const result = await blockAvailabilityDay();
    expect(result.status).toBe(400);
  });

  it('crea bloqueig nou si no existeix', async () => {
    const result = await blockAvailabilityDay('2026-09-15', 'Festiu');

    expect(result.status).toBe(200);
    expect(mockPrisma.availability.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'BLOCKED',
        note: 'Festiu',
      }),
    });
  });

  it('actualitza si ja existeix', async () => {
    mockPrisma.availability.findUnique.mockResolvedValue({ id: 'existing', status: 'AVAILABLE' });

    const result = await blockAvailabilityDay('2026-09-15', 'Nova nota');

    expect(result.status).toBe(200);
    expect(mockPrisma.availability.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing' },
        data: { status: 'BLOCKED', note: 'Nova nota' },
      })
    );
    expect(mockPrisma.availability.create).not.toHaveBeenCalled();
  });

  it('posa hora a migdia per evitar problemes TZ', async () => {
    await blockAvailabilityDay('2026-09-15');

    const createCall = mockPrisma.availability.create.mock.calls[0][0];
    const dateObj = createCall.data.date as Date;
    expect(dateObj.getHours()).toBe(12);
  });
});

describe('unblockAvailabilityDay', () => {
  it('elimina per id', async () => {
    const result = await unblockAvailabilityDay('avail-1');

    expect(result.status).toBe(200);
    expect(mockPrisma.availability.delete).toHaveBeenCalledWith({ where: { id: 'avail-1' } });
  });

  it('elimina per data si no hi ha id', async () => {
    const result = await unblockAvailabilityDay(null, '2026-09-15');

    expect(result.status).toBe(200);
    expect(mockPrisma.availability.deleteMany).toHaveBeenCalled();
  });

  it('retorna 400 sense id ni data', async () => {
    const result = await unblockAvailabilityDay(null, null);

    expect(result.status).toBe(400);
  });
});
