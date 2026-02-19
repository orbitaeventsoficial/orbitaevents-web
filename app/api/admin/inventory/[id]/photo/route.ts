// app/api/admin/inventory/[id]/photo/route.ts
// API per pujar fotos d'inventari a Supabase Storage
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'inventory';
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

let bucketEnsured = false;

/** Crea el bucket si no existeix (una sola vegada per instància) */
async function ensureBucket() {
  if (bucketEnsured || !supabaseAdmin) return;
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
      });
      log.info(`Bucket "${BUCKET}" creat automàticament a Supabase Storage`);
    }
    bucketEnsured = true;
  } catch (err) {
    log.error('Error creant bucket:', err);
  }
}

interface Params {
  params: { id: string };
}

// POST - Pujar foto (multipart/form-data)
export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = params;

    // Verificar que l'element existeix
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

    // Assegurar que el bucket existeix
    await ensureBucket();

    // Llegir el fitxer del FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No s\'ha enviat cap fitxer' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El fitxer supera 10 MB' }, { status: 400 });
    }

    // Generar path: inventory/{code}.webp
    const filePath = `${item.code.toLowerCase()}.webp`;

    // Eliminar foto anterior si existeix al mateix path
    await supabaseAdmin.storage.from(BUCKET).remove([filePath]);

    // Pujar el fitxer (ja ve convertit a WebP des del client)
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
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

    // Obtenir URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Actualitzar l'element amb la nova URL
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

    // Eliminar de Supabase Storage
    if (supabaseAdmin && item.imageUrl) {
      const filePath = `${item.code.toLowerCase()}.webp`;
      await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
    }

    // Netejar URL a la BD
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
