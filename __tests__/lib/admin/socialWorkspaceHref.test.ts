import { describe, expect, it } from 'vitest';
import { buildSocialWorkspaceHref } from '@/lib/admin/socialWorkspaceHref';

describe('buildSocialWorkspaceHref', () => {
  it('obre la llista social quan no hi ha post concret', () => {
    expect(buildSocialWorkspaceHref()).toBe('/admin/social');
  });

  it('obre un post social concret amb query estable', () => {
    expect(buildSocialWorkspaceHref('post 1')).toBe('/admin/social?postId=post%201');
  });
});
