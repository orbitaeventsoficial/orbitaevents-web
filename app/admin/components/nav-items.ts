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
    title: 'Operacions',
    defaultOpen: true,
    items: [
      { icon: '📄', label: 'Pressupostos', href: '/admin/presupuestos' },
      { icon: '💶', label: 'Finances', href: '/admin/economia' },
      { icon: '📥', label: 'Safata (IMAP)', href: '/admin/inbox', badge: 'IMAP', badgeColor: 'blue' },
      { icon: '📊', label: 'Sales Ops', href: '/admin/sales-ops' },
    ],
  },
  {
    title: 'Producte',
    defaultOpen: false,
    items: [
      { icon: '🎵', label: 'Packs', href: '/admin/packs' },
      { icon: '📦', label: 'Inventari', href: '/admin/inventory' },
      { icon: '💰', label: 'Preus', href: '/admin/pricing' },
      { icon: '🎟️', label: 'Descomptes', href: '/admin/discount-codes' },
    ],
  },
  {
    title: 'Contingut',
    defaultOpen: false,
    items: [
      { icon: '📰', label: 'Blog', href: '/admin/blog' },
      { icon: '✅', label: 'Ressenyes', href: '/admin/ressenyes' },
      { icon: '🤖', label: 'Correus', href: '/admin/emails', badge: 'AUTO', badgeColor: 'green' },
      { icon: '✉️', label: 'Plantilles email', href: '/admin/email-templates' },
    ],
  },
  {
    title: 'Avançat',
    defaultOpen: false,
    items: [
      { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
      { icon: '📝', label: 'Post-esdeveniment', href: '/admin/post-event' },
      { icon: '❓', label: 'FAQ', href: '/admin/faq' },
      { icon: '✏️', label: 'Textos', href: '/admin/text-manager' },
      { icon: '⭐', label: 'Ressenyes Google', href: '/admin/google-reviews' },
      { icon: '🗂️', label: 'Catàleg', href: '/admin/catalog' },
      { icon: '📈', label: 'Analítica', href: '/admin/analytics' },
      { icon: '🔒', label: 'Privacitat RGPD', href: '/admin/privacy' },
      { icon: '⚙️', label: 'Configuració', href: '/admin/settings' },
      { icon: '🔗', label: 'Integracions', href: '/admin/settings/integrations' },
      { icon: '🔄', label: 'Crons', href: '/admin/crons' },
      { icon: '🎛️', label: 'Features', href: '/admin/features' },
      { icon: '🗺️', label: 'Cobertura', href: '/admin/coverage' },
      { icon: '📊', label: 'Estadístiques web', href: '/admin/stats' },
      { icon: '🎨', label: 'Tema admin', href: '/admin/css-manager' },
      { icon: '🛠️', label: 'Scripts i eines', href: '/admin/scripts' },
    ],
  },
];
