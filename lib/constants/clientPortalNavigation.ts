export const CLIENT_PORTAL_NAV_ITEMS = [
  { key: 'hub', path: '' },
  { key: 'payments', path: '/payments' },
  { key: 'timeline', path: '/timeline' },
  { key: 'contract', path: '/contract' },
  { key: 'gallery', path: '/gallery' },
] as const;

export type ClientPortalNavKey = (typeof CLIENT_PORTAL_NAV_ITEMS)[number]['key'];
