import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { FALLBACK_OFFER, getPublicOffer, PUBLIC_CACHE_HEADERS } from '@/lib/services/publicOfferService';

export const revalidate = 900;

export async function GET() {
  try {
    return NextResponse.json({ ok: true, offer: await getPublicOffer() }, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    log.error('Error obtenint offer:', error);
    return NextResponse.json({ ok: true, offer: FALLBACK_OFFER }, { headers: PUBLIC_CACHE_HEADERS });
  }
}