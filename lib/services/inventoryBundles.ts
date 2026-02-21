import { prisma } from '@/lib/prisma';

export const INVENTORY_BUNDLES_SETTING_KEY = 'inventory.bundles.v1';

export type InventoryBundle = {
  id: string;
  name: string;
  itemIds: string[];
};

function normalizeBundles(raw: unknown): InventoryBundle[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const rec = entry as Record<string, unknown>;
      const id = String(rec.id || '').trim();
      const name = String(rec.name || '').trim();
      const itemIds = Array.isArray(rec.itemIds)
        ? rec.itemIds.map((v) => String(v || '').trim()).filter(Boolean)
        : [];
      return { id, name, itemIds };
    })
    .filter((b) => b.id && b.name);
}

export async function getInventoryBundles(): Promise<InventoryBundle[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: INVENTORY_BUNDLES_SETTING_KEY },
  });

  if (!setting?.value) {
    return [{ id: 'equip-1', name: 'Equip 1', itemIds: [] }];
  }

  try {
    const parsed = JSON.parse(setting.value) as { bundles?: unknown };
    const bundles = normalizeBundles(parsed?.bundles);
    if (bundles.length === 0) return [{ id: 'equip-1', name: 'Equip 1', itemIds: [] }];
    return bundles;
  } catch {
    return [{ id: 'equip-1', name: 'Equip 1', itemIds: [] }];
  }
}

export async function saveInventoryBundles(bundles: InventoryBundle[]): Promise<InventoryBundle[]> {
  const normalized = normalizeBundles(bundles);
  const payload = JSON.stringify({ bundles: normalized });

  await prisma.setting.upsert({
    where: { key: INVENTORY_BUNDLES_SETTING_KEY },
    update: {
      value: payload,
      type: 'JSON',
      category: 'config',
      label: 'Lots d\'inventari',
      description: 'Definició d\'equips/lots reutilitzables per a reserves',
    },
    create: {
      key: INVENTORY_BUNDLES_SETTING_KEY,
      value: payload,
      type: 'JSON',
      category: 'config',
      label: 'Lots d\'inventari',
      description: 'Definició d\'equips/lots reutilitzables per a reserves',
    },
  });

  return normalized;
}

