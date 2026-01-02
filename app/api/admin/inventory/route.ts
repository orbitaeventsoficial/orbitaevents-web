// app/api/admin/inventory/route.ts
// API per gestionar inventari
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { InventoryCategory, ItemStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const inventorySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'SOUND', 'LIGHTING', 'EFFECTS', 'STRUCTURE', 'CABLING',
    'TECH', 'DECORATION_HP', 'DECORATION_HW', 'DECORATION_GEN', 'CONSUMABLE'
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
});

// GET - Llistar inventari amb filtres
export async function GET(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Validar enums
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
        _count: {
          select: {
            bookingItems: true,
            usageHistory: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });

    // Estadístiques per categoria
    const stats = await prisma.inventoryItem.groupBy({
      by: ['category'],
      _count: true,
      _sum: { value: true },
    });

    return NextResponse.json({
      ok: true,
      items,
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
  // Verificar autenticació
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

    // Verificar codi únic
    const existing = await prisma.inventoryItem.findUnique({
      where: { code: parsed.data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: `El codi ${parsed.data.code} ja existeix` },
        { status: 409 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: parsed.data,
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
