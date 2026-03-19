import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  listHeroMedia,
  addHeroMedia,
  removeHeroMedia,
  toggleHeroMedia,
  reorderHeroMedia,
} from '@/lib/services/heroVideoService';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const media = await listHeroMedia();
  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const label = (formData.get('label') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'Cal un fitxer' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await addHeroMedia({
      file: { buffer, originalName: file.name },
      label,
    });
    return NextResponse.json(result);
  }

  // JSON body — external URL or toggle/reorder
  const body = await req.json();

  if (body.action === 'toggle' && body.id) {
    await toggleHeroMedia(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'reorder' && body.ids) {
    await reorderHeroMedia(body.ids);
    return NextResponse.json({ ok: true });
  }

  if (body.url) {
    const result = await addHeroMedia({
      externalUrl: body.url,
      label: body.label || '',
      mediaType: body.type,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Acció no vàlida' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Cal un ID' }, { status: 400 });

  await removeHeroMedia(id);
  return NextResponse.json({ ok: true });
}
