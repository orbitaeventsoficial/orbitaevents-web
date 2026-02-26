export type BadgeColor = 'orange' | 'blue' | 'green' | 'red';

export interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: BadgeColor;
}

export interface NavSection {
  title: string;
  defaultOpen: boolean;
  items: NavItem[];
}

export function getPriorityItems(newLeadsCount: number): NavItem[] {
  return [
    { icon: '📥', label: 'Entrades', href: '/admin/leads', badge: newLeadsCount > 0 ? String(newLeadsCount) : undefined, badgeColor: 'orange' },
    { icon: '👤', label: 'Clients', href: '/admin/clientes' },
    { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
    { icon: '📝', label: 'Tasques', href: '/admin/tasks' },
    { icon: '📅', label: 'Calendari', href: '/admin/calendario' },
  ];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operativa',
    defaultOpen: true,
    items: [
      { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
      { icon: '📦', label: 'Inventari', href: '/admin/inventory' },
      { icon: '🎟️', label: 'Descomptes', href: '/admin/discount-codes' },
      { icon: '📥', label: 'Safata (IMAP)', href: '/admin/inbox', badge: 'IMAP', badgeColor: 'blue' },
    ],
  },
  {
    title: 'Eines',
    defaultOpen: false,
    items: [
      { icon: '💶', label: 'Economia', href: '/admin/economia' },
      { icon: '⭐', label: 'Ressenyes clients', href: '/admin/ressenyes' },
      { icon: '📝', label: 'Post-esdeveniment', href: '/admin/post-event' },
      { icon: '📈', label: 'Analítica', href: '/admin/analytics' },
      { icon: '🗂️', label: 'Catàleg', href: '/admin/catalog' },
      { icon: '🤖', label: 'Correus automàtics', href: '/admin/emails', badge: 'AUTO', badgeColor: 'green' },
      { icon: '📰', label: 'Blog', href: '/admin/blog' },
    ],
  },
  {
    title: 'Configuració',
    defaultOpen: false,
    items: [
      { icon: '⚙️', label: 'Configuració', href: '/admin/settings' },
      { icon: '🔗', label: 'Integracions', href: '/admin/settings/integrations' },
      { icon: '🎛️', label: 'Features', href: '/admin/features' },
      { icon: '🗺️', label: 'Cobertura', href: '/admin/coverage' },
    ],
  },
];
