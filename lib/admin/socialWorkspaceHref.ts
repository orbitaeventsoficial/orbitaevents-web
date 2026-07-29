export function buildSocialWorkspaceHref(postId?: string | null): string {
  const cleanPostId = typeof postId === 'string' ? postId.trim() : '';
  if (!cleanPostId) return '/admin/social';
  return `/admin/social?postId=${encodeURIComponent(cleanPostId)}`;
}
