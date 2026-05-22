import { describe, expect, it } from 'vitest';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';

describe('buildProposalHref', () => {
  it('construeix la ruta de fitxa pressupost', () => {
    expect(buildProposalHref('proposal-123')).toBe('/admin/presupuestos/proposal-123');
  });
});
