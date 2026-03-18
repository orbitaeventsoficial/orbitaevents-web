/**
 * API Portfolio Media — CRUD directe per categoria
 * GET    ?slug=bodas         → llistar media de la categoria
 * POST   FormData(file,slug) → pujar media
 * PATCH  JSON(mediaId,...)   → actualitzar caption/ordre
 * DELETE ?mediaId=xxx        → eliminar media
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addPortfolioMedia,
  listPortfolioMedia,
  updatePortfolioMedia,
  deletePortfolioMedia,
  isValidSlug,
  detectMediaType,
} from '@/lib/services/portfolioMediaService';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug || !isValidSlug(slug)) {
      return NextResponse.json({ error: 'Slug invàlid o absent' }, { status: 400 });
    }
    const data = await listPortfolioMedia(slug);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET portfolio media error:', err);
    return NextResponse.json({ error: 'Error carregant media' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = formData.get('slug') as string | null;
    const caption = (formData.get('caption') as string) || undefined;

    if (!file || !slug) {
      return NextResponse.json({ error: 'Fitxer i slug requerits' }, { status: 400 });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Slug invàlid' }, { status: 400 });
    }

    const mediaType = detectMediaType(file.type);
    if (!mediaType) {
      return NextResponse.json({ error: `Tipus no permès: ${file.type}` }, { status: 400 });
    }

    const maxSize = mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return NextResponse.json({ error: `Fitxer massa gran (màx ${maxMB}MB)` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const media = await addPortfolioMedia({
      slug,
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      caption,
    });

    return NextResponse.json({ data: media }, { status: 201 });
  } catch (err) {
    console.error('POST portfolio media error:', err);
    const message = err instanceof Error ? err.message : 'Error pujant media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId, caption, sortOrder } = body;

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId requerit' }, { status: 400 });
    }

    const updated = await updatePortfolioMedia(mediaId, {
      ...(caption !== undefined && { caption }),
      ...(sortOrder !== undefined && { sortOrder }),
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH portfolio media error:', err);
    return NextResponse.json({ error: 'Error actualitzant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const mediaId = request.nextUrl.searchParams.get('mediaId');
    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId requerit' }, { status: 400 });
    }

    await deletePortfolioMedia(mediaId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE portfolio media error:', err);
    return NextResponse.json({ error: 'Error eliminant' }, { status: 500 });
  }
}
