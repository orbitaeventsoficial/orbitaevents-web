import { describe, expect, it } from 'vitest';

import { TESTIMONIAL_COPY } from '@/lib/email-i18n';

describe('TESTIMONIAL_COPY', () => {
  it('uses review wording for approved testimonial email in English', () => {
    expect(TESTIMONIAL_COPY.en.approved).toContain('Your review has been approved');
    expect(TESTIMONIAL_COPY.en.approved).toContain('We love reading your review');
    expect(TESTIMONIAL_COPY.en.approved).not.toContain('feedback');
  });
});
