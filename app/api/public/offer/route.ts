import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { PUBLIC_OFFER_CACHE_HEADERS, PUBLIC_OFFER_FALLBACK } from '@/lib/constants';
import { getPublicOffer } from '@/lib/services/publicOfferService';

export const revalidate = 900;

export async function GET() {
  try {
    return NextResponse.json({ ok: true, offer: await getPublicOffer() }, { headers: PUBLIC_OFFER_CACHE_HEADERS });
  } catch (error) {
    log.error('Error obtenint offer:', error);
    return NextResponse.json({ ok: true, offer: PUBLIC_OFFER_FALLBACK }, { headers: PUBLIC_OFFER_CACHE_HEADERS });
  }
}