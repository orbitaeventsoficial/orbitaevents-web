import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import type { InventoryBundle } from '@/lib/inventory-bundles-contract';

const INVENTORY_BUNDLES_SETTING_KEY = 'inventory.bundles.v1';

const bundleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  itemIds: z.array(z.string().min(1)).default([]),
});

const payloadSchema = z.object({
  bundles: z.array(bundleSchema),
});

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

function getDefaultInventoryBundles(): InventoryBundle[] {
  return [{ id: 'equip-1', name: 'Equip 1', itemIds: [] }];
}

export async function getInventoryBundles(): Promise<InventoryBundle[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: INVENTORY_BUNDLES_SETTING_KEY },
  });

  if (!setting?.value) {
    return getDefaultInventoryBundles();
  }

  try {
    const parsed = JSON.parse(setting.value) as { bundles?: unknown };
    const bundles = normalizeBundles(parsed?.bundles);
    if (bundles.length === 0) return getDefaultInventoryBundles();
    return bundles;
  } catch (error) {
    log.error('[InventoryBundles] Error parsejant bundles:', error);
    return getDefaultInventoryBundles();
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

export async function listAdminInventoryBundles() {
  const bundles = await getInventoryBundles();
  const allItemIds = Array.from(new Set(bundles.flatMap((bundle) => bundle.itemIds)));
  const items = allItemIds.length > 0
    ? await prisma.inventoryItem.findMany({
        where: { id: { in: allItemIds } },
        select: { id: true, code: true, name: true, category: true, status: true },
      })
    : [];
  const itemById = new Map(items.map((item) => [item.id, item]));

  return {
    ok: true,
    bundles: bundles.map((bundle) => ({
      ...bundle,
      items: bundle.itemIds.map((id) => itemById.get(id)).filter(Boolean),
    })),
  };
}

export async function saveAdminInventoryBundles(input: unknown) {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400 as const,
      body: { error: 'Dades invàlides', details: parsed.error.flatten() },
    };
  }

  const incoming = parsed.data.bundles.map((bundle) => ({
    ...bundle,
    id: bundle.id.trim(),
    name: bundle.name.trim(),
    itemIds: Array.from(new Set(bundle.itemIds.map((id) => id.trim()).filter(Boolean))),
  }));
  const duplicateBundleIds = incoming.filter((bundle, index) => incoming.findIndex((candidate) => candidate.id === bundle.id) !== index);
  if (duplicateBundleIds.length > 0) {
    return {
      status: 400 as const,
      body: { error: 'Hi ha IDs de lot duplicats' },
    };
  }

  const allItemIds = Array.from(new Set(incoming.flatMap((bundle) => bundle.itemIds)));
  if (allItemIds.length > 0) {
    const existingIds = await prisma.inventoryItem.findMany({
      where: { id: { in: allItemIds } },
      select: { id: true },
    });
    const idSet = new Set(existingIds.map((item) => item.id));
    const invalid = allItemIds.filter((id) => !idSet.has(id));
    if (invalid.length > 0) {
      return {
        status: 400 as const,
        body: { error: 'Alguns elements no existeixen', invalid },
      };
    }
  }

  const bundles = await saveInventoryBundles(incoming);
  return {
    status: 200 as const,
    body: { ok: true, bundles },
  };
}
