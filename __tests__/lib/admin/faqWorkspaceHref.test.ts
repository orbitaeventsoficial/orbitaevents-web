import { describe, expect, it } from 'vitest';
import { buildFaqHref } from '@/lib/admin/faqWorkspaceHref';

describe('buildFaqHref', () => {
  it('construeix la ruta de detall FAQ', () => {
    expect(buildFaqHref('faq-123')).toBe('/admin/faq/faq-123');
  });
});
