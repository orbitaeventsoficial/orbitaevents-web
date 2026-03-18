import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findUnique: vi.fn(), upsert: vi.fn() },
    inventoryItem: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import {
  getInventoryBundles,
  saveInventoryBundles,
  listAdminInventoryBundles,
  saveAdminInventoryBundles,
} from '@/lib/services/inventoryBundles';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.inventoryItem.findMany.mockResolvedValue([]);
});

describe('getInventoryBundles', () => {
  it('retorna default si no hi ha setting', async () => {
    const bundles = await getInventoryBundles();

    expect(bundles).toEqual([{ id: 'equip-1', name: 'Equip 1', itemIds: [] }]);
  });

  it('parseja bundles de la BD', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({ bundles: [{ id: 'lot-a', name: 'Lot A', itemIds: ['i1'] }] }),
    });

    const bundles = await getInventoryBundles();

    expect(bundles).toEqual([{ id: 'lot-a', name: 'Lot A', itemIds: ['i1'] }]);
  });

  it('retorna default si JSON invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'not-json' });

    const bundles = await getInventoryBundles();

    expect(bundles).toEqual([{ id: 'equip-1', name: 'Equip 1', itemIds: [] }]);
  });

  it('retorna default si bundles buit', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({ bundles: [] }),
    });

    const bundles = await getInventoryBundles();

    expect(bundles).toEqual([{ id: 'equip-1', name: 'Equip 1', itemIds: [] }]);
  });

  it('filtra bundles sense id o name', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({
        bundles: [
          { id: '', name: 'No ID', itemIds: [] },
          { id: 'ok', name: '', itemIds: [] },
          { id: 'valid', name: 'Valid', itemIds: [] },
        ],
      }),
    });

    const bundles = await getInventoryBundles();

    expect(bundles).toEqual([{ id: 'valid', name: 'Valid', itemIds: [] }]);
  });
});

describe('saveInventoryBundles', () => {
  it('normalitza i desa', async () => {
    const result = await saveInventoryBundles([
      { id: ' lot-1 ', name: ' Lot 1 ', itemIds: ['  i1  ', ''] },
    ]);

    expect(result).toEqual([{ id: 'lot-1', name: 'Lot 1', itemIds: ['i1'] }]);
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'inventory.bundles.v1' },
      })
    );
  });
});

describe('listAdminInventoryBundles', () => {
  it('enriqueix bundles amb items reals', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({ bundles: [{ id: 'lot-1', name: 'Lot 1', itemIds: ['item-1', 'item-2'] }] }),
    });
    mockPrisma.inventoryItem.findMany.mockResolvedValue([
      { id: 'item-1', code: 'MIC01', name: 'Micro', category: 'audio', status: 'ACTIVE' },
    ]);

    const result = await listAdminInventoryBundles();

    expect(result.ok).toBe(true);
    expect(result.bundles[0].items).toHaveLength(1);
    expect(result.bundles[0].items[0]!.code).toBe('MIC01');
  });
});

describe('saveAdminInventoryBundles', () => {
  it('retorna 400 amb input invàlid', async () => {
    const result = await saveAdminInventoryBundles({ bundles: 'not-array' });
    expect(result.status).toBe(400);
  });

  it('retorna 400 amb IDs de lot duplicats', async () => {
    const result = await saveAdminInventoryBundles({
      bundles: [
        { id: 'dup', name: 'A', itemIds: [] },
        { id: 'dup', name: 'B', itemIds: [] },
      ],
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('duplicats');
  });

  it('retorna 400 si items no existeixen', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

    const result = await saveAdminInventoryBundles({
      bundles: [{ id: 'lot-1', name: 'Lot 1', itemIds: ['inexistent'] }],
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('no existeixen');
  });

  it('desa correctament amb items vàlids', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([{ id: 'item-1' }]);

    const result = await saveAdminInventoryBundles({
      bundles: [{ id: 'lot-1', name: 'Lot 1', itemIds: ['item-1'] }],
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });
});
