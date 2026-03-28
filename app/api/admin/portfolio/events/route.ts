/**
 * API Portfolio Events — CRUD per events concrets del portfolio
 * GET    ?categorySlug=bodas&published=true  → llistar events
 * POST   JSON(slug,categorySlug,title,...)   → crear event
 * PATCH  JSON(id,...)                        → actualitzar
 * DELETE ?id=xxx                             → eliminar
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  createPortfolioEvent,
  listPortfolioEvents,
  updatePortfolioEvent,
  deletePortfolioEvent,
} from '@/lib/services/portfolioEventService';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const sp = request.nextUrl.searchParams;
    const categorySlug = sp.get('categorySlug') || undefined;
    const publishedParam = sp.get('published');
    const published = publishedParam === 'false' ? false : publishedParam === 'all' ? undefined : true;
    const limit = Number(sp.get('limit') || 50);
    const offset = Number(sp.get('offset') || 0);

    const result = await listPortfolioEvents({ categorySlug, published, limit, offset });
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET portfolio events error:', err);
    return NextResponse.json({ error: 'Error carregant events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { slug, categorySlug, title, subtitle, venue, location, eventDate, guestCount, description, services, coverImage, published } = body;

    if (!slug || !categorySlug || !title || !coverImage) {
      return NextResponse.json({ error: 'slug, categorySlug, title i coverImage requerits' }, { status: 400 });
    }

    const event = await createPortfolioEvent({
      slug,
      categorySlug,
      title,
      subtitle,
      venue,
      location,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      guestCount: guestCount ? Number(guestCount) : undefined,
      description,
      services: services || [],
      coverImage,
      published: published ?? false,
    });

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    console.error('POST portfolio event error:', err);
    const msg = err instanceof Error ? err.message : 'Error creant event';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id requerit' }, { status: 400 });

    if (data.eventDate) data.eventDate = new Date(data.eventDate);

    const updated = await updatePortfolioEvent(id, data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH portfolio event error:', err);
    return NextResponse.json({ error: 'Error actualitzant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerit' }, { status: 400 });

    await deletePortfolioEvent(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE portfolio event error:', err);
    return NextResponse.json({ error: 'Error eliminant' }, { status: 500 });
  }
}
