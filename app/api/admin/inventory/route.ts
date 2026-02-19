// app/api/admin/inventory/route.ts
// API per gestionar inventari
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { InventoryCategory, ItemStatus } from '@prisma/client';
import { generateNextCode } from '@/lib/inventory-utils';

export const dynamic = 'force-dynamic';

const inventorySchema = z.object({
  code: z.string().optional(), // Ara és opcional: si no s'envia, s'auto-genera
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'SOUND', 'LIGHTING', 'EFFECTS', 'STRUCTURE', 'CABLING',
    'TECH', 'DECORATION_HP', 'DECORATION_HW', 'DECORATION_GEN', 'CONSUMABLE',
  ]),
  watts: z.number().optional(),
  value: z.number().min(0),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'RETIRED']).optional(),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  isConsumable: z.boolean().optional(),
  stockQuantity: z.number().optional(),
  minStock: z.number().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  expectedLifeHours: z.number().optional(),
});

// GET - Llistar inventari amb filtres
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const validCategory = category && Object.values(InventoryCategory).includes(category as InventoryCategory)
      ? (category as InventoryCategory)
      : undefined;
    const validStatus = status && Object.values(ItemStatus).includes(status as ItemStatus)
      ? (status as ItemStatus)
      : undefined;

    const items = await prisma.inventoryItem.findMany({
      where: {
        ...(validCategory && { category: validCategory }),
        ...(validStatus && { status: validStatus }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
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

    // Afegir hores acumulades a cada element
    const itemsWithHours = items.map((item) => ({
      ...item,
      totalHoursUsed: item.usageHistory.reduce((sum, u) => sum + (u.hoursUsed || 0), 0),
    }));

    // Estadístiques per categoria
    const stats = await prisma.inventoryItem.groupBy({
      by: ['category'],
      _count: true,
      _sum: { value: true },
    });

    return NextResponse.json({
      ok: true,
      items: itemsWithHours,
      stats: stats.reduce((acc, s) => {
        acc[s.category] = { count: s._count, totalValue: s._sum.value || 0 };
        return acc;
      }, {} as Record<string, { count: number; totalValue: number }>),
      total: items.length,
    });
  } catch (error) {
    log.error('Error obtenint inventari:', error);
    return NextResponse.json(
      { error: 'Error obtenint inventari' },
      { status: 500 }
    );
  }
}

// POST - Crear nou element d'inventari
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = inventorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Auto-generar codi si no s'envia
    let code = data.code?.trim().toUpperCase();
    if (!code) {
      const existingItems = await prisma.inventoryItem.findMany({
        where: { category: data.category as InventoryCategory },
        select: { code: true },
      });
      code = generateNextCode(
        data.category as InventoryCategory,
        existingItems.map((i) => i.code)
      );
    }

    // Verificar codi únic
    const existing = await prisma.inventoryItem.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: `El codi ${code} ja existeix` },
        { status: 409 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        category: data.category as InventoryCategory,
        watts: data.watts,
        value: data.value,
        status: data.status as ItemStatus | undefined,
        condition: data.condition as any,
        isConsumable: data.isConsumable,
        stockQuantity: data.stockQuantity,
        minStock: data.minStock,
        imageUrl: data.imageUrl,
        notes: data.notes,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        purchasePrice: data.purchasePrice,
        expectedLifeHours: data.expectedLifeHours,
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

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    log.error('Error creant element inventari:', error);
    return NextResponse.json(
      { error: 'Error creant element' },
      { status: 500 }
    );
  }
}
