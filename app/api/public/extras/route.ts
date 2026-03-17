import { NextResponse } from 'next/server';
import { listPublicExtras } from '@/lib/services/publicExtrasService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'ca';

  try {
    const result = await listPublicExtras(locale);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Extras] Error carregant des de BD, fallback a config:', error);
    const result = await listPublicExtras(locale).catch(() => ({ extras: [], source: 'config' as const }));
    return NextResponse.json({ ok: true, ...result });
  }
}

