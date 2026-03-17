import sharp from 'sharp';
import { InventoryCategory, ItemStatus, type ItemCondition } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generateNextCode } from '@/lib/inventory-utils';
import { uploadFile, deleteFile, isLocalStorageUrl } from '@/lib/storage';
import {
  INVENTORY_IMAGE_MAX_DIMENSION,
  INVENTORY_IMAGE_MAX_FILE_SIZE,
  INVENTORY_IMAGE_WEBP_QUALITY,
  inventoryImagePath,
} from '@/lib/inventory-image-constants';

type InventoryListInput = {
  category?: string | null;
  status?: string | null;
  search?: string | null;
};

type InventoryCreateInput = {
  code?: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  watts?: number;
  value: number;
  status?: ItemStatus;
  condition?: ItemCondition;
  isConsumable?: boolean;
  stockQuantity?: number;
  minStock?: number;
  imageUrl?: string;
  notes?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  expectedLifeHours?: number;
};

type InventoryUpdateInput = Record<string, unknown> & {
  purchaseDate?: string | Date | null;
};

async function normalizeInventoryImage(file: File): Promise<Buffer> {
  const input = Buffer.from(await file.arrayBuffer());

  return sharp(input)
    .rotate()
    .resize({
      width: INVENTORY_IMAGE_MAX_DIMENSION,
      height: INVENTORY_IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: INVENTORY_IMAGE_WEBP_QUALITY })
    .toBuffer();
}

export async function listInventoryAdminData(input: InventoryListInput) {
  const validCategory = input.category && Object.values(InventoryCategory).includes(input.category as InventoryCategory)
    ? (input.category as InventoryCategory)
    : undefined;
  const validStatus = input.status && Object.values(ItemStatus).includes(input.status as ItemStatus)
    ? (input.status as ItemStatus)
    : undefined;

  const items = await prisma.inventoryItem.findMany({
    where: {
      ...(validCategory && { category: validCategory }),
      ...(validStatus && { status: validStatus }),
      ...(input.search && {
        OR: [
          { code: { contains: input.search, mode: 'insensitive' } },
          { name: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      packItems: {
        include: { pack: { select: { id: true, slug: true } } },
      },
      usageHistory: {
        select: { hoursUsed: true },
      },
      _count: {
        select: {
          bookingItems: true,
          usageHistory: true,
        },
      },
    },
    orderBy: [{ category: 'asc' }, { code: 'asc' }],
  });

  const itemsWithHours = items.map((item) => ({
    ...item,
    totalHoursUsed: item.usageHistory.reduce((sum, usage) => sum + (usage.hoursUsed || 0), 0),
  }));

  const stats = await prisma.inventoryItem.groupBy({
    by: ['category'],
    _count: true,
    _sum: { value: true },
  });

  return {
    ok: true,
    items: itemsWithHours,
    stats: stats.reduce((acc, row) => {
      acc[row.category] = { count: row._count, totalValue: row._sum.value || 0 };
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>),
    total: items.length,
  };
}

export async function createInventoryItem(input: InventoryCreateInput) {
  let code = input.code?.trim().toUpperCase();
  if (!code) {
    const existingItems = await prisma.inventoryItem.findMany({
      where: { category: input.category },
      select: { code: true },
    });
    code = generateNextCode(input.category, existingItems.map((item) => item.code));
  }

  const existing = await prisma.inventoryItem.findUnique({
    where: { code },
  });

  if (existing) {
    return { status: 409, body: { error: `El codi ${code} ja existeix` } };
  }

  const item = await prisma.inventoryItem.create({
    data: {
      code,
      name: input.name,
      description: input.description,
      category: input.category,
      watts: input.watts,
      value: input.value,
      status: input.status,
      condition: input.condition,
      isConsumable: input.isConsumable,
      stockQuantity: input.stockQuantity,
      minStock: input.minStock,
      imageUrl: input.imageUrl,
      notes: input.notes,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchasePrice: input.purchasePrice,
      expectedLifeHours: input.expectedLifeHours,
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'CREATE',
      entity: 'inventory',
      entityId: item.id,
      details: { code: item.code, name: item.name },
    },
  });

  return { status: 200, body: { ok: true, item } };
}

export async function getInventoryItemDetails(id: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      packItems: {
        include: { pack: { include: { translations: true } } },
      },
      extraItems: {
        include: { extra: { include: { translations: true } } },
      },
      bookingItems: {
        include: {
          booking: {
            select: {
              id: true,
              reference: true,
              eventDate: true,
              clientName: true,
              status: true,
              eventStartTime: true,
              eventEndTime: true,
            },
          },
        },
        orderBy: { booking: { eventDate: 'desc' } },
      },
      usageHistory: {
        orderBy: { usedAt: 'desc' },
      },
    },
  });

  if (!item) {
    return { status: 404, body: { error: 'Element no trobat' } };
  }

  const totalHoursUsed = item.usageHistory.reduce((sum, usage) => sum + (usage.hoursUsed || 0), 0);

  return {
    status: 200,
    body: {
      ok: true,
      item: {
        ...item,
        totalHoursUsed,
      },
    },
  };
}

export async function updateInventoryItem(id: string, input: InventoryUpdateInput) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) {
    return { status: 404, body: { error: 'Element no trobat' } };
  }

  const data = { ...input };
  if (data.purchaseDate && typeof data.purchaseDate === 'string') {
    data.purchaseDate = new Date(data.purchaseDate);
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data,
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'inventory',
      entityId: id,
      details: { changes: Object.keys(data) },
    },
  });

  return { status: 200, body: { ok: true, item } };
}

export async function deleteInventoryItem(id: string) {
  const existing = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      _count: {
        select: { bookingItems: true, packItems: true },
      },
    },
  });

  if (!existing) {
    return { status: 404, body: { error: 'Element no trobat' } };
  }

  const softDeleted = existing._count.bookingItems > 0 || existing._count.packItems > 0;
  if (softDeleted) {
    await prisma.inventoryItem.update({
      where: { id },
      data: { status: 'RETIRED' },
    });
  } else {
    await prisma.inventoryItem.delete({ where: { id } });
  }

  await prisma.adminLog.create({
    data: {
      action: 'DELETE',
      entity: 'inventory',
      entityId: id,
      details: { code: existing.code },
    },
  });

  return { status: 200, body: { ok: true, softDeleted } };
}

export async function uploadInventoryItemPhoto(id: string, file: File | null) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    select: { id: true, code: true, imageUrl: true },
  });

  if (!item) {
    return { status: 404, body: { error: 'Element no trobat' } };
  }

  if (!file) {
    return { status: 400, body: { error: "No s'ha enviat cap fitxer" } };
  }

  if (file.size > INVENTORY_IMAGE_MAX_FILE_SIZE) {
    return { status: 400, body: { error: 'El fitxer supera 10 MB' } };
  }

  const filePath = `inventory/${inventoryImagePath(item.code)}`;
  await deleteFile(filePath);

  const buffer = await normalizeInventoryImage(file);
  const result = await uploadFile(filePath, buffer);

  await prisma.inventoryItem.update({
    where: { id },
    data: { imageUrl: result.publicUrl },
  });

  return { status: 200, body: { ok: true, imageUrl: result.publicUrl } };
}

export async function deleteInventoryItemPhoto(id: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    select: { id: true, code: true, imageUrl: true },
  });

  if (!item) {
    return { status: 404, body: { error: 'Element no trobat' } };
  }

  if (item.imageUrl && isLocalStorageUrl(item.imageUrl)) {
    const filePath = `inventory/${inventoryImagePath(item.code)}`;
    await deleteFile(filePath);
  }

  await prisma.inventoryItem.update({
    where: { id },
    data: { imageUrl: null },
  });

  return { status: 200, body: { ok: true } };
}
