// app/api/admin/inventory/route.ts
// API per gestionar inventari
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { InventoryCategory, ItemStatus } from '@prisma/client';
import { createInventoryItem, listInventoryAdminData } from '@/lib/services/inventoryAdminService';

export const dynamic = 'force-dynamic';

const inventorySchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.enum([
    'SOUND', 'LIGHTING', 'EFFECTS', 'STRUCTURE', 'CABLING',
    'TECH', 'DECORATION_HP', 'DECORATION_HW', 'DECORATION_GEN', 'CONSUMABLE',
  ]),
  watts: z.number().nullable().optional(),
  value: z.number().min(0),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'RETIRED']).optional(),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).optional(),
  isConsumable: z.boolean().optional(),
  stockQuantity: z.number().nullable().optional(),
  minStock: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  purchasePriceSource: z.string().nullable().optional(),
  expectedLifeHours: z.number().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const result = await listInventoryAdminData({
      category: searchParams.get('category'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
    });
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint inventari:', error);
    return NextResponse.json(
      { error: 'Error obtenint inventari' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const parsed = inventorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createInventoryItem({
      ...parsed.data,
      category: parsed.data.category as InventoryCategory,
      status: parsed.data.status as ItemStatus | undefined,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant element inventari:', error);
    return NextResponse.json(
      { error: 'Error creant element' },
      { status: 500 }
    );
  }
}
