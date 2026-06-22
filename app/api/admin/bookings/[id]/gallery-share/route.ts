import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { createGalleryShareToken, revokeGalleryShareToken, getGalleryShareInfo } from '@/lib/services/galleryService';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

const CreateSchema = z.object({
  password: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const info = await getGalleryShareInfo(id);
  return NextResponse.json(info);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const result = await createGalleryShareToken(id, parsed.data.password);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creant gallery share token:', error);
    return NextResponse.json({ error: 'Error creant el link' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const { id } = await params;
  try {
    await revokeGalleryShareToken(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error revocant gallery share token:', error);
    return NextResponse.json({ error: 'Error revocant el link' }, { status: 500 });
  }
}
