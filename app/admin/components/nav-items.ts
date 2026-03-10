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
    title: 'Comercial',
    defaultOpen: true,
    items: [
      { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
      { icon: '📥', label: 'Safata (IMAP)', href: '/admin/inbox', badge: 'IMAP', badgeColor: 'blue' },
      { icon: '📄', label: 'Pressupostos', href: '/admin/presupuestos' },
      { icon: '📊', label: 'Sales Ops', href: '/admin/sales-ops' },
      { icon: '📝', label: 'Post-esdeveniment', href: '/admin/post-event' },
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
      { icon: '🗂️', label: 'Catàleg', href: '/admin/catalog' },
    ],
  },
  {
    title: 'Finances',
    defaultOpen: false,
    items: [
      { icon: '💶', label: 'Economia', href: '/admin/economia' },
      { icon: '📈', label: 'Analítica', href: '/admin/analytics' },
    ],
  },
  {
    title: 'Contingut',
    defaultOpen: false,
    items: [
      { icon: '📰', label: 'Blog', href: '/admin/blog' },
      { icon: '❓', label: 'FAQ', href: '/admin/faq' },
      { icon: '✏️', label: 'Textos', href: '/admin/text-manager' },
      { icon: '⭐', label: 'Ressenyes Google', href: '/admin/google-reviews' },
      { icon: '✅', label: 'Testimonis (aprovar)', href: '/admin/ressenyes' },
      { icon: '🤖', label: 'Correus automàtics', href: '/admin/emails', badge: 'AUTO', badgeColor: 'green' },
      { icon: '✉️', label: 'Plantilles email', href: '/admin/email-templates' },
    ],
  },
  {
    title: 'Configuració',
    defaultOpen: false,
    items: [
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
