import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import {
  deleteImageManagerAsset,
  getImageManagerPayload,
  reorderImageManagerAssets,
  saveImageManagerModifications,
  uploadImageManagerAsset,
} from '@/lib/services/imageManagerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    return NextResponse.json(await getImageManagerPayload());
  } catch (error) {
    log.error('Error llegint image manager:', error);
    return NextResponse.json({ ok: false, error: 'Error llegint configuracio d\'imatges' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await saveImageManagerModifications(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error desant image manager:', error);
    return NextResponse.json({ ok: false, error: 'Error desant configuracio d\'imatges' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const key = typeof formData.get('key') === 'string' ? String(formData.get('key')) : '';
    const alt = typeof formData.get('alt') === 'string' ? String(formData.get('alt')) : undefined;
    const label = typeof formData.get('label') === 'string' ? String(formData.get('label')) : undefined;
    const replace = String(formData.get('replace') || '') === '1';

    if (!file || !(file instanceof File) || !key) {
      return NextResponse.json({ ok: false, error: 'Fitxer i placement requerits' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, error: 'Fitxer massa gran (maxim 10 MB)' }, { status: 413 });
    }

    const asset = await uploadImageManagerAsset({
      key,
      fileBuffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      alt,
      label,
      replace,
    });

    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch (error) {
    log.error('Error pujant asset image manager:', error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error pujant asset' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const key = typeof body?.key === 'string' ? body.key : '';
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!key || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Placement i items requerits' }, { status: 400 });
    }

    await reorderImageManagerAssets({ key, items });
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error reordenant image manager:', error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error reordenant' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const key = typeof body?.key === 'string' ? body.key : '';
    const assetId = typeof body?.assetId === 'string' ? body.assetId : undefined;

    if (!key) {
      return NextResponse.json({ ok: false, error: 'Placement requerit' }, { status: 400 });
    }

    await deleteImageManagerAsset({ key, assetId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant asset image manager:', error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error eliminant asset' }, { status: 500 });
  }
}
