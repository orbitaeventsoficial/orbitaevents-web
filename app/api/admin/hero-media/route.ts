import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  deleteImageManagerAsset,
  getManagedImageCollection,
  reorderImageManagerAssets,
  saveImageManagerModifications,
  uploadImageManagerAsset,
} from '@/lib/services/imageManagerService';

const HERO_PLACEMENT_KEY = 'home.hero.slides';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const media = await getManagedImageCollection(HERO_PLACEMENT_KEY);
  return NextResponse.json(
    (media || []).map((item) => ({
      id: item.id,
      url: item.src,
      type: item.mimeType?.startsWith('video/') ? 'video' : 'image',
      label: item.label || item.alt || 'Hero media',
      active: true,
      sortOrder: item.sortOrder,
    }))
  );
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
    const result = await uploadImageManagerAsset({
      key: HERO_PLACEMENT_KEY,
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      label,
      replace: false,
    });
    return NextResponse.json(result);
  }

  const body = await req.json();

  if (body.action === 'reorder' && Array.isArray(body.ids)) {
    await reorderImageManagerAssets({
      key: HERO_PLACEMENT_KEY,
      items: body.ids.map((id: string, index: number) => ({ id, sortOrder: index })),
    });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.url === 'string' && body.url.trim()) {
    const current = await getManagedImageCollection(HERO_PLACEMENT_KEY);
    const nextItems = [
      ...(current || []).map((item) => ({ id: item.id, src: item.src, alt: item.alt, label: item.label, sortOrder: item.sortOrder })),
      { src: body.url.trim(), label: body.label || 'External', sortOrder: current?.length || 0 },
    ];

    await saveImageManagerModifications({
      modifications: {
        [HERO_PLACEMENT_KEY]: {
          mode: 'manual',
          items: nextItems,
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'toggle' && body.id) {
    return NextResponse.json({ ok: false, error: 'El hero unificat no suporta estat actiu/inactiu per item des d’aquesta ruta antiga' }, { status: 400 });
  }

  return NextResponse.json({ error: 'Acció no vàlida' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Cal un ID' }, { status: 400 });

  await deleteImageManagerAsset({ key: HERO_PLACEMENT_KEY, assetId: id });
  return NextResponse.json({ ok: true });
}
