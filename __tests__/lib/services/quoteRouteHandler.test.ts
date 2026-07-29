import { describe, expect, it } from 'vitest';

import { handleLeadQuoteGet, handleLeadQuotePost } from '@/lib/services/leads/quoteRouteHandler';

describe('lead quote route handler legacy guard', () => {
  it('retorna 410 al GET legacy', async () => {
    const res = await handleLeadQuoteGet(undefined, 'lead-1');
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.canonicalRoute).toBe('/admin/presupuestos');
  });

  it('retorna 410 al POST legacy', async () => {
    const res = await handleLeadQuotePost(undefined, 'lead-1');
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.error).toContain('Flux antic');
  });
});
