/**
 * API per pujar fotos d'inventari (Local Storage)
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { uploadFile, deleteFile, isLocalStorageUrl } from '@/lib/storage';
import {
  INVENTORY_IMAGE_MAX_DIMENSION,
  INVENTORY_IMAGE_MAX_FILE_SIZE,
  INVENTORY_IMAGE_WEBP_QUALITY,
  inventoryImagePath,
} from '@/lib/inventory-image-constants';

interface Params {
  params: { id: string };
}

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

// POST - Pujar foto (multipart/form-data)
export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, code: true, imageUrl: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Element no trobat' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No s'ha enviat cap fitxer" }, { status: 400 });
    }

    if (file.size > INVENTORY_IMAGE_MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El fitxer supera 10 MB' }, { status: 400 });
    }

    const filePath = `inventory/${inventoryImagePath(item.code)}`;

    // Eliminar foto anterior si existeix
    await deleteFile(filePath);

    const buffer = await normalizeInventoryImage(file);
    const result = await uploadFile(filePath, buffer);

    await prisma.inventoryItem.update({
      where: { id },
      data: { imageUrl: result.publicUrl },
    });

    return NextResponse.json({ ok: true, imageUrl: result.publicUrl });
  } catch (error) {
    log.error('Error pujant foto inventari:', error);
    return NextResponse.json({ error: 'Error pujant foto' }, { status: 500 });
  }
}

// DELETE - Eliminar foto
export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, code: true, imageUrl: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Element no trobat' }, { status: 404 });
    }

    if (item.imageUrl && isLocalStorageUrl(item.imageUrl)) {
      const filePath = `inventory/${inventoryImagePath(item.code)}`;
      await deleteFile(filePath);
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: { imageUrl: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant foto inventari:', error);
    return NextResponse.json({ error: 'Error eliminant foto' }, { status: 500 });
  }
}
