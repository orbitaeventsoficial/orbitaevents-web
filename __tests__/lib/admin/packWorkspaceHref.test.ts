import { describe, expect, it } from 'vitest';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';

describe('buildPackHref', () => {
  it('construeix la fitxa canònica del pack', () => {
    expect(buildPackHref('pack-1')).toBe('/admin/packs/pack-1');
  });

  it('afegeix la pestanya content quan toca', () => {
    expect(buildPackHref('pack-2', 'content')).toBe('/admin/packs/pack-2?tab=content');
  });
});
