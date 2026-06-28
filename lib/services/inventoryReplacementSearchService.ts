// lib/services/inventoryReplacementSearchService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Cerca de REPOSICIÓ d'inventari via SerpApi (motor Google Shopping).
// Donat el nom d'un producte, torna candidats reals: preu, botiga, enllaç i foto.
// Font NEUTRAL: SerpApi només PROPOSA; la dada estable la valida l'humà (model #1199).
// Quota: tier gratuït 100/mes (compartit amb Google Reviews) — usar amb mesura.
// ─────────────────────────────────────────────────────────────────────────────

import { PREFERRED_REPLACEMENT_SOURCES } from '@/lib/constants/inventory';

export interface ReplacementCandidate {
  title: string;
  price: number | null;
  priceLabel: string | null;
  source: string | null;   // botiga (Amazon, DJ Mania…)
  link: string | null;     // enllaç de compra
  thumbnail: string | null; // foto del producte
}

export interface ReplacementSearchResult {
  query: string;
  ok: boolean;
  error?: string;
  candidates: ReplacementCandidate[];
}

const SERPAPI_BASE = 'https://serpapi.com/search.json';

/** Re-ordena: les botigues preferents primer, mantenint l'ordre relatiu de la resta. */
function rankPreferred(candidates: ReplacementCandidate[]): ReplacementCandidate[] {
  const isPreferred = (c: ReplacementCandidate) =>
    PREFERRED_REPLACEMENT_SOURCES.some((s) => (c.source ?? '').toLowerCase().includes(s));
  return [...candidates].sort((a, b) => Number(isPreferred(b)) - Number(isPreferred(a)));
}

/**
 * Cerca candidats de reposició per a un producte concret.
 * @param query nom del producte (ex. "Pioneer DDJ-REV7")
 * @param limit nombre màxim de candidats (default 5)
 */
export async function searchReplacementCandidates(
  query: string,
  limit = 5,
): Promise<ReplacementSearchResult> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return { query, ok: false, error: 'SERPAPI_KEY no configurada', candidates: [] };
  }
  if (!query.trim()) {
    return { query, ok: false, error: 'Consulta buida', candidates: [] };
  }

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    google_domain: 'google.es',
    gl: 'es',
    hl: 'es',
    location: 'Spain',
    api_key: apiKey,
  });

  try {
    const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`);
    const data = await res.json();
    if (data.error) return { query, ok: false, error: String(data.error), candidates: [] };

    const mapped: ReplacementCandidate[] = (data.shopping_results || [])
      .map((it: Record<string, unknown>) => ({
        title: String(it.title ?? ''),
        price: typeof it.extracted_price === 'number' ? it.extracted_price : null,
        priceLabel: it.price ? String(it.price) : null,
        source: it.source ? String(it.source) : null,
        link: (it.product_link ?? it.link) ? String(it.product_link ?? it.link) : null,
        thumbnail: it.thumbnail ? String(it.thumbnail) : null,
      }));

    // Prioritza botigues preferents (finançament), després retalla a `limit`.
    const candidates = rankPreferred(mapped).slice(0, limit);
    return { query, ok: true, candidates };
  } catch (error) {
    return { query, ok: false, error: error instanceof Error ? error.message : 'Error desconegut', candidates: [] };
  }
}
