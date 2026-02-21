import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getInventoryBundles, saveInventoryBundles } from '@/lib/services/inventoryBundles';

const bundleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  itemIds: z.array(z.string().min(1)).default([]),
});

const payloadSchema = z.object({
  bundles: z.array(bundleSchema),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const bundles = await getInventoryBundles();
  const allItemIds = Array.from(new Set(bundles.flatMap((b) => b.itemIds)));
  const items = allItemIds.length > 0
    ? await prisma.inventoryItem.findMany({
        where: { id: { in: allItemIds } },
        select: { id: true, code: true, name: true, category: true, status: true },
      })
    : [];
  const itemById = new Map(items.map((it) => [it.id, it]));

  return NextResponse.json({
    ok: true,
    bundles: bundles.map((b) => ({
      ...b,
      items: b.itemIds.map((id) => itemById.get(id)).filter(Boolean),
    })),
  });
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
  }

  const incoming = parsed.data.bundles.map((b) => ({
    ...b,
    id: b.id.trim(),
    name: b.name.trim(),
    itemIds: Array.from(new Set(b.itemIds.map((id) => id.trim()).filter(Boolean))),
  }));
  const duplicateBundleIds = incoming.filter((b, idx) => incoming.findIndex((x) => x.id === b.id) !== idx);
  if (duplicateBundleIds.length > 0) {
    return NextResponse.json({ error: 'Hi ha IDs de lot duplicats' }, { status: 400 });
  }

  const allItemIds = Array.from(new Set(incoming.flatMap((b) => b.itemIds)));
  if (allItemIds.length > 0) {
    const existingIds = await prisma.inventoryItem.findMany({
      where: { id: { in: allItemIds } },
      select: { id: true },
    });
    const idSet = new Set(existingIds.map((x) => x.id));
    const invalid = allItemIds.filter((id) => !idSet.has(id));
    if (invalid.length > 0) {
      return NextResponse.json({ error: 'Alguns elements no existeixen', invalid }, { status: 400 });
    }
  }

  const saved = await saveInventoryBundles(incoming);
  return NextResponse.json({ ok: true, bundles: saved });
}

