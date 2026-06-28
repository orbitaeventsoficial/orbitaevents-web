import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { deleteInventoryItem, getInventoryItemDetails, updateInventoryItem } from '@/lib/services/inventoryAdminService';

interface Params {
  params: { id: string };
}

const inventoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.enum([
    'SOUND', 'LIGHTING', 'EFFECTS', 'STRUCTURE', 'CABLING',
    'TECH', 'DECORATION_HP', 'DECORATION_HW', 'DECORATION_GEN', 'CONSUMABLE',
  ]).optional(),
  watts: z.number().nullable().optional(),
  value: z.number().min(0).optional(),
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
}).strict();

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await getInventoryItemDetails(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint element:', error);
    return NextResponse.json({ error: 'Error obtenint element' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const parsed = inventoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await updateInventoryItem(params.id, parsed.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant element:', error);
    return NextResponse.json({ error: 'Error actualitzant element' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await deleteInventoryItem(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant element:', error);
    return NextResponse.json({ error: 'Error eliminant element' }, { status: 500 });
  }
}
