import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getTextManagerPayload, runTextManagerAction, saveTextManagerModifications } from '@/lib/services/textManagerService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    return NextResponse.json(await getTextManagerPayload());
  } catch (error) {
    log.error('Error llegint textos:', error);
    return NextResponse.json(
      { ok: false, error: 'Error llegint fitxers de traducció' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  try {
    const body = await req.json();
    const result = await saveTextManagerModifications(body as {
      modifications: Record<string, string>;
      locale?: 'es' | 'ca' | 'en';
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error desant textos:', error);
    return NextResponse.json(
      { ok: false, error: 'Error desant modificacions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  try {
    const body = await req.json();
    const result = await runTextManagerAction((body as { action?: string }).action || '');
    if ('body' in result && 'status' in result) {
      return NextResponse.json(result.body, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error en operació:', error);
    return NextResponse.json(
      { ok: false, error: 'Error en l\'operació' },
      { status: 500 }
    );
  }
}