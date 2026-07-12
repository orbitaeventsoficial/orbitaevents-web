import { describe, expect, it } from 'vitest';

import { sendAdminQuoteEmail } from '@/lib/services/adminQuoteEmailService';

describe('sendAdminQuoteEmail legacy guard', () => {
  it('retorna 410 i apunta al flux canònic de Proposal', async () => {
    const result = await sendAdminQuoteEmail({ leadId: 'lead-1', packId: 'basic', price: 500 });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(410);
    expect(result.body).toEqual(expect.objectContaining({
      ok: false,
      canonicalRoute: '/api/admin/proposals/:id/send',
    }));
  });
});
