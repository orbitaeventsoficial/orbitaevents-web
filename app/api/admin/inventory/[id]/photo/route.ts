// app/api/admin/inventory/[id]/photo/route.ts
// API per pujar fotos d'inventari a Supabase Storage
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  INVENTORY_BUCKET,
  INVENTORY_BUCKET_CONFIG,
  INVENTORY_IMAGE_MAX_DIMENSION,
  INVENTORY_IMAGE_MAX_FILE_SIZE,
  INVENTORY_IMAGE_WEBP_QUALITY,
  inventoryImagePath,
  isInventoryBucketUrl,
} from '@/lib/inventory-image-constants';

let bucketEnsured = false;

/** Crea el bucket si no existeix (una sola vegada per instància de servidor) */
async function ensureBucket() {
  if (bucketEnsured || !supabaseAdmin) return;
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === INVENTORY_BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(INVENTORY_BUCKET, INVENTORY_BUCKET_CONFIG);
      log.info(`Bucket "${INVENTORY_BUCKET}" creat automàticament a Supabase Storage`);
    }
    bucketEnsured = true;
  } catch (err) {
    log.error('Error creant bucket:', err);
  }
}

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase Storage no configurat' },
        { status: 503 }
      );
    }

    await ensureBucket();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No s'ha enviat cap fitxer" }, { status: 400 });
    }

    if (file.size > INVENTORY_IMAGE_MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El fitxer supera 10 MB' }, { status: 400 });
    }

    const filePath = inventoryImagePath(item.code);

    // Eliminar foto anterior si existeix al mateix path
    await supabaseAdmin.storage.from(INVENTORY_BUCKET).remove([filePath]);

    const buffer = await normalizeInventoryImage(file);
    const { error: uploadError } = await supabaseAdmin.storage
      .from(INVENTORY_BUCKET)
      .upload(filePath, buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      log.error('Error pujant a Supabase Storage:', uploadError);
      return NextResponse.json(
        { error: 'Error pujant fitxer a Storage' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(INVENTORY_BUCKET)
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    await prisma.inventoryItem.update({
      where: { id },
      data: { imageUrl },
    });

    return NextResponse.json({ ok: true, imageUrl });
  } catch (error) {
    log.error('Error pujant foto inventari:', error);
    return NextResponse.json(
      { error: 'Error pujant foto' },
      { status: 500 }
    );
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

    // Eliminar de Supabase Storage — només si la URL pertany al nostre bucket.
    // Evita intentar eliminar imatges externes (URLs d'altres dominis o fonts antigues).
    if (supabaseAdmin && item.imageUrl && isInventoryBucketUrl(item.imageUrl)) {
      const filePath = inventoryImagePath(item.code);
      const { error: removeError } = await supabaseAdmin.storage
        .from(INVENTORY_BUCKET)
        .remove([filePath]);
      if (removeError) {
        log.warn("No s'ha pogut eliminar la imatge del Storage (continuem):", {
          message: removeError.message,
          name: removeError.name,
        });
      }
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: { imageUrl: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant foto inventari:', error);
    return NextResponse.json(
      { error: 'Error eliminant foto' },
      { status: 500 }
    );
  }
}
