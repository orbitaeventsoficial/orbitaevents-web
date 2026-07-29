import { describe, expect, it } from 'vitest';

import { handleLeadQuoteGet, handleLeadQuotePost } from '@/lib/services/leads/quoteRouteHandler';

describe('lead quote route handler legacy guard', () => {
  it('desactiva el GET HTML antic', async () => {
    const res = await handleLeadQuoteGet(undefined, 'lead-1');
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.ok).toBe(false);
  });

  it('desactiva el POST creador de LeadDocument QUOTE', async () => {
    const res = await handleLeadQuotePost(undefined, 'lead-1');
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.canonicalRoute).toBe('/admin/presupuestos');
  });
});
