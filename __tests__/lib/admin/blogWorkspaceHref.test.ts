import { describe, expect, it } from 'vitest';
import { buildBlogEditHref } from '@/lib/admin/blogWorkspaceHref';

describe('buildBlogEditHref', () => {
  it('construeix la ruta d\'edició de post', () => {
    expect(buildBlogEditHref('post-abc')).toBe('/admin/blog/edit/post-abc');
  });
});
