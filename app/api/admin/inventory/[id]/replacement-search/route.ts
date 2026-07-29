import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { searchReplacementForItem } from '@/lib/services/inventoryReplacementSearchService';

interface Params {
  params: { id: string };
}

// Cerca candidats de reposició per a un item (DJ Mania primer + més barats).
// GET (read-only); query opcional `q` per refinar; per defecte el nom de l'item.
export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const q = req.nextUrl.searchParams.get('q') ?? undefined;
    const result = await searchReplacementForItem(params.id, q);

    if (!result.itemFound) {
      return NextResponse.json({ ok: false, error: 'Element no trobat' }, { status: 404 });
    }
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? 'Error de cerca' }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      query: result.query,
      cheapestPrice: result.cheapestPrice,
      candidates: result.candidates,
    });
  } catch (error) {
    log.error('Error cercant reposició', error, {
      context: { endpoint: 'admin/inventory/[id]/replacement-search:GET', id: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error de cerca' }, { status: 500 });
  }
}
