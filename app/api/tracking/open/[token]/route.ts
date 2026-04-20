// app/api/tracking/open/[token]/route.ts
// Tracking pixel — retorna 1x1 GIF transparent i registra obertura.
// Endpoint públic (el carrega el client d'email del destinatari).

import { NextRequest, NextResponse } from 'next/server';
import { recordEmailOpen, TRACKING_PIXEL_GIF } from '@/lib/services/emailTrackingService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Fire and forget — no bloquejar la resposta esperant la BD
  recordEmailOpen(token).catch(() => {});

  return new NextResponse(TRACKING_PIXEL_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
