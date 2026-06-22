/**
 * API Portfolio Media — CRUD directe per categoria
 * GET    ?slug=bodas         → llistar media de la categoria
 * POST   FormData(file,slug) → pujar media
 * PATCH  JSON(mediaId,...)   → actualitzar caption/ordre/event
 * DELETE ?mediaId=xxx        → eliminar media
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import {
  addPortfolioMedia,
  listPortfolioMedia,
  updatePortfolioMedia,
  deletePortfolioMedia,
  isValidSlug,
  detectMediaType,
} from '@/lib/services/portfolioMediaService';
import {
  PORTFOLIO_MEDIA_IMAGE_MAX_SIZE,
  PORTFOLIO_MEDIA_VIDEO_MAX_SIZE,
} from '@/lib/constants/portfolio-media';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

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
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

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

    const maxSize = mediaType === 'video' ? PORTFOLIO_MEDIA_VIDEO_MAX_SIZE : PORTFOLIO_MEDIA_IMAGE_MAX_SIZE;
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
      uploadedBy: 'ADMIN',
    });

    return NextResponse.json({ data: media }, { status: 201 });
  } catch (err) {
    console.error('POST portfolio media error:', err);
    const message = err instanceof Error ? err.message : 'Error pujant media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { mediaId, caption, sortOrder, eventId } = body;

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId requerit' }, { status: 400 });
    }

    const updated = await updatePortfolioMedia(mediaId, {
      ...(caption !== undefined && { caption }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(eventId !== undefined && { eventId }),
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH portfolio media error:', err);
    return NextResponse.json({ error: 'Error actualitzant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

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
