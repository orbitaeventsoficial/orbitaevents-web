import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getAdminPackById, updateAdminPack } from '@/lib/services/packAdminService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updateAdminPack(id, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant pack:', error);
    return NextResponse.json({ error: 'Error actualitzant pack' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const result = await getAdminPackById(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint pack:', error);
    return NextResponse.json({ error: 'Error obtenint pack' }, { status: 500 });
  }
}
