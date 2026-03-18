/**
 * API ROUTE: Booking Gallery Photos
 * CRUD de fotos de la galeria d'un booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  addGalleryPhoto,
  listGalleryPhotos,
  updateGalleryPhoto,
  deleteGalleryPhoto,
} from '@/lib/services/galleryService';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

/** Llistar fotos d'un booking */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const photos = await listGalleryPhotos(id);
    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    console.error('Error llistant galeria:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}

/** Afegir foto a un booking */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Cal un fitxer' }, { status: 400 });
    }

    // Validar tipus
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipus de fitxer no permès. Usa JPG, PNG, WebP o AVIF.' },
        { status: 400 }
      );
    }

    // Validar mida (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Fitxer massa gran (màx 10MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const caption = formData.get('caption') as string | null;
    const isPortfolio = formData.get('isPortfolio') === 'true';
    const isPortal = formData.get('isPortal') !== 'false'; // default true
    const portfolioSlug = formData.get('portfolioSlug') as string | null;

    const photo = await addGalleryPhoto({
      bookingId: id,
      fileBuffer: buffer,
      fileName: file.name,
      caption: caption || undefined,
      isPortfolio,
      isPortal,
      portfolioSlug: portfolioSlug || undefined,
      uploadedBy: 'ADMIN',
    });

    return NextResponse.json({ success: true, data: photo }, { status: 201 });
  } catch (error) {
    console.error('Error pujant foto:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}

/** Actualitzar foto (caption, flags) */
export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { photoId, ...data } = body;

    if (!photoId) {
      return NextResponse.json({ success: false, error: 'Cal photoId' }, { status: 400 });
    }

    const photo = await updateGalleryPhoto(photoId, data);
    return NextResponse.json({ success: true, data: photo });
  } catch (error) {
    console.error('Error actualitzant foto:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}

/** Eliminar foto */
export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ success: false, error: 'Cal photoId' }, { status: 400 });
    }

    await deleteGalleryPhoto(photoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminant foto:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}
