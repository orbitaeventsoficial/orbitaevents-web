export type AdminRole = 'OWNER' | 'MANAGER' | 'VIEWER';

const CONTENT_ALLOWED: AdminRole[] = ['OWNER', 'MANAGER'];

export function normalizeAdminRole(value?: string | null): AdminRole {
  const role = (value || '').toUpperCase();
  if (role === 'MANAGER') return 'MANAGER';
  if (role === 'VIEWER') return 'VIEWER';
  return 'OWNER';
}

export function canManageContent(role: AdminRole): boolean {
  return CONTENT_ALLOWED.includes(role);
}
