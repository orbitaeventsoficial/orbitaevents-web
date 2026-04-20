// app/api/tracking/click/[token]/route.ts
// Click tracking — registra clic i redirigeix a la URL original.
// Endpoint públic (el carrega el client d'email del destinatari).

import { NextRequest, NextResponse } from 'next/server';
import { recordEmailClick } from '@/lib/services/emailTrackingService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const url = req.nextUrl.searchParams.get('url');

  // Fire and forget — no bloquejar la redirecció esperant la BD
  recordEmailClick(token).catch(() => {});

  if (!url) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Validar que la URL és segura (no javascript:, data:, etc.)
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.redirect(parsed.toString());
  } catch {
    return NextResponse.redirect(new URL('/', req.url));
  }
}
