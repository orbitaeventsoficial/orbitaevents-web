import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchReplacementCandidates } from '@/lib/services/inventoryReplacementSearchService';

const originalKey = process.env.SERPAPI_KEY;

afterEach(() => {
  vi.restoreAllMocks();
  process.env.SERPAPI_KEY = originalKey;
});

function mockShopping(results: unknown[]) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ shopping_results: results }),
  }) as unknown as typeof fetch;
}

describe('searchReplacementCandidates', () => {
  it('retorna error si no hi ha clau', async () => {
    delete process.env.SERPAPI_KEY;
    const r = await searchReplacementCandidates('GoPro 11');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('SERPAPI_KEY');
  });

  it('retorna error amb consulta buida', async () => {
    process.env.SERPAPI_KEY = 'x';
    const r = await searchReplacementCandidates('   ');
    expect(r.ok).toBe(false);
  });

  it('parseja preu, botiga, enllaç i foto', async () => {
    process.env.SERPAPI_KEY = 'x';
    mockShopping([
      { title: 'GoPro Hero 11', extracted_price: 389.99, price: '389,99 €', source: 'Nootica', product_link: 'https://nootica.es/x', thumbnail: 'https://img/x' },
    ]);
    const r = await searchReplacementCandidates('GoPro 11');
    expect(r.ok).toBe(true);
    expect(r.candidates[0]).toMatchObject({
      price: 389.99, source: 'Nootica', link: 'https://nootica.es/x', thumbnail: 'https://img/x',
    });
  });

  it('prioritza DJ Mania quan apareix als resultats', async () => {
    process.env.SERPAPI_KEY = 'x';
    mockShopping([
      { title: 'Oqan A', extracted_price: 100, source: 'Amazon.es' },
      { title: 'Oqan B', extracted_price: 94.5, source: 'DJMania' },
      { title: 'Oqan C', extracted_price: 99, source: 'Sonicolor' },
    ]);
    const r = await searchReplacementCandidates('Oqan QSS001ST', 5);
    expect(r.ok).toBe(true);
    expect(r.candidates[0].source).toBe('DJMania'); // preferent primer
  });
});
