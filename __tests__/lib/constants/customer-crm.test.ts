import { describe, expect, it } from 'vitest';

import { CUSTOMER_NEXT_STEPS } from '@/lib/constants/customer-crm';

describe('CUSTOMER_NEXT_STEPS', () => {
  it('uses review wording for the post-event CRM hint', () => {
    expect(CUSTOMER_NEXT_STEPS.POST_EVENT.hint).toBe('Tanca review, testimoni i seguiment de recurrencia.');
    expect(CUSTOMER_NEXT_STEPS.POST_EVENT.hint).not.toContain('feedback');
  });
});
