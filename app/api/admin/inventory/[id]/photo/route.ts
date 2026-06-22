/**
 * API per pujar fotos d'inventari (Local Storage)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { deleteInventoryItemPhoto, uploadInventoryItemPhoto } from '@/lib/services/inventoryAdminService';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const formData = await req.formData();
    const result = await uploadInventoryItemPhoto(params.id, formData.get('file') as File | null);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error pujant foto inventari:', error);
    return NextResponse.json({ error: 'Error pujant foto' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await deleteInventoryItemPhoto(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant foto inventari:', error);
    return NextResponse.json({ error: 'Error eliminant foto' }, { status: 500 });
  }
}
