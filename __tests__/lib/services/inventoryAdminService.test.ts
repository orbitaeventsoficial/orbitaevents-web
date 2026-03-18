import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGenerateNextCode } = vi.hoisted(() => ({
  mockPrisma: {
    inventoryItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
  mockGenerateNextCode: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/inventory-utils', () => ({ generateNextCode: mockGenerateNextCode }));
vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  readFile: vi.fn(),
  getPublicUrl: vi.fn(),
  isLocalStorageUrl: vi.fn(),
}));
vi.mock('@/lib/inventory-image-constants', () => ({
  INVENTORY_IMAGE_MAX_DIMENSION: 800,
  INVENTORY_IMAGE_MAX_FILE_SIZE: 10485760,
  INVENTORY_IMAGE_WEBP_QUALITY: 80,
  inventoryImagePath: vi.fn().mockReturnValue('test.webp'),
}));
vi.mock('sharp', () => ({
  default: vi.fn().mockReturnValue({
    rotate: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
  }),
}));

import {
  listInventoryAdminData,
  createInventoryItem,
  getInventoryItemDetails,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/lib/services/inventoryAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.inventoryItem.findMany.mockResolvedValue([]);
  mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);
  mockPrisma.inventoryItem.create.mockResolvedValue({ id: 'inv-1', code: 'AUD01', name: 'Test' });
  mockPrisma.inventoryItem.update.mockResolvedValue({ id: 'inv-1' });
  mockPrisma.inventoryItem.delete.mockResolvedValue({});
  mockPrisma.inventoryItem.groupBy.mockResolvedValue([]);
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockGenerateNextCode.mockReturnValue('AUD01');
});

describe('listInventoryAdminData', () => {
  it('retorna estructura amb items i stats', async () => {
    const result = await listInventoryAdminData({});

    expect(result.ok).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('aplica filtre de cerca', async () => {
    await listInventoryAdminData({ search: 'micro' });

    expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ code: { contains: 'micro', mode: 'insensitive' } }),
          ]),
        }),
      })
    );
  });

  it('calcula totalHoursUsed', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        usageHistory: [{ hoursUsed: 10 }, { hoursUsed: 5 }],
        _count: { bookingItems: 2, usageHistory: 2 },
      },
    ]);

    const result = await listInventoryAdminData({});

    expect(result.items[0].totalHoursUsed).toBe(15);
  });
});

describe('createInventoryItem', () => {
  it('genera codi automàtic si no proporcionat', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

    await createInventoryItem({ name: 'Altaveu', category: 'AUDIO' as never, value: 500 });

    expect(mockGenerateNextCode).toHaveBeenCalledWith('AUDIO', []);
  });

  it('retorna 409 si codi duplicat', async () => {
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await createInventoryItem({ code: 'AUD01', name: 'Altaveu', category: 'AUDIO' as never, value: 500 });

    expect(result.status).toBe(409);
  });

  it('crea item i adminLog', async () => {
    const result = await createInventoryItem({ name: 'Altaveu', category: 'AUDIO' as never, value: 500 });

    expect(result.status).toBe(200);
    expect(mockPrisma.inventoryItem.create).toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'CREATE', entity: 'inventory' }),
    });
  });
});

describe('getInventoryItemDetails', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getInventoryItemDetails('inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna item amb totalHoursUsed', async () => {
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({
      id: 'inv-1',
      usageHistory: [{ hoursUsed: 8 }, { hoursUsed: 12 }],
    });

    const result = await getInventoryItemDetails('inv-1');

    expect(result.status).toBe(200);
    expect(result.body.item!.totalHoursUsed).toBe(20);
  });
});

describe('updateInventoryItem', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await updateInventoryItem('inexistent', { name: 'Updated' });
    expect(result.status).toBe(404);
  });

  it('actualitza i crea adminLog', async () => {
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({ id: 'inv-1' });

    const result = await updateInventoryItem('inv-1', { name: 'Updated' });

    expect(result.status).toBe(200);
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'UPDATE', entity: 'inventory' }),
    });
  });
});

describe('deleteInventoryItem', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await deleteInventoryItem('inexistent');
    expect(result.status).toBe(404);
  });

  it('soft delete si té bookings o packs', async () => {
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({
      id: 'inv-1', code: 'AUD01',
      _count: { bookingItems: 3, packItems: 1 },
    });

    const result = await deleteInventoryItem('inv-1');

    expect(result.status).toBe(200);
    expect(result.body.softDeleted).toBe(true);
    expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { status: 'RETIRED' },
    });
  });

  it('hard delete si no té dependències', async () => {
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({
      id: 'inv-1', code: 'AUD01',
      _count: { bookingItems: 0, packItems: 0 },
    });

    const result = await deleteInventoryItem('inv-1');

    expect(result.status).toBe(200);
    expect(result.body.softDeleted).toBe(false);
    expect(mockPrisma.inventoryItem.delete).toHaveBeenCalledWith({ where: { id: 'inv-1' } });
  });
});
