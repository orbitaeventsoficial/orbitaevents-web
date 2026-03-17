// app/api/admin/translate/route.ts
// API de traduccio automatica per al gestor de textos
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { detectAdminContentLanguage, translateAdminContent } from '@/lib/services/adminTranslationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const rateLimit = await checkRateLimit(req, {
    limit: 30,
    windowSeconds: 300,
    prefix: 'admin-translate',
  });
  if (rateLimit) return rateLimit;

  try {
    const body = await req.json();
    const result = await translateAdminContent(body ?? {});

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    log.error('Error en traduccio:', error);
    return NextResponse.json({ ok: false, error: 'Error en traduccio' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const rateLimit = await checkRateLimit(req, {
    limit: 60,
    windowSeconds: 300,
    prefix: 'admin-translate-detect',
  });
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text') || '';
    const result = detectAdminContentLanguage(text);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    log.error('Error detectant idioma:', error);
    return NextResponse.json({ ok: false, error: 'Error detectant idioma' }, { status: 500 });
  }
}