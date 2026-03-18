type BadgeColor = 'orange' | 'blue' | 'green' | 'red';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: BadgeColor;
}

interface NavSection {
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
      { icon: '🧮', label: 'Calculadora costos', href: '/admin/cost-calculator' },
      { icon: '💶', label: 'Finances', href: '/admin/economia' },
      { icon: '🤝', label: 'Col·laboradors', href: '/admin/collaborators' },
      { icon: '📥', label: 'Safata (IMAP)', href: '/admin/inbox', badge: 'IMAP', badgeColor: 'blue' },
      { icon: '📊', label: 'Sales Ops', href: '/admin/sales-ops' },
      { icon: '⚡', label: 'Entrada ràpida', href: '/admin/intake' },
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
      { icon: '📋', label: 'Catàleg', href: '/admin/catalog' },
    ],
  },
  {
    title: 'Contingut',
    defaultOpen: false,
    items: [
      { icon: '📰', label: 'Blog', href: '/admin/blog' },
      { icon: '✅', label: 'Ressenyes', href: '/admin/ressenyes' },
      { icon: '⭐', label: 'Ressenyes Google', href: '/admin/google-reviews' },
      { icon: '🤖', label: 'Correus', href: '/admin/emails', badge: 'AUTO', badgeColor: 'green' },
      { icon: '✉️', label: 'Plantilles email', href: '/admin/email-templates' },
      { icon: '🖼️', label: 'Portfolio', href: '/admin/portfolio' },
    ],
  },
  {
    title: 'Avançat',
    defaultOpen: false,
    items: [
      { icon: '📝', label: 'Post-esdeveniment', href: '/admin/post-event' },
      { icon: '📈', label: 'Analítica', href: '/admin/analytics' },
      { icon: '❓', label: 'FAQ', href: '/admin/faq' },
      { icon: '✏️', label: 'Textos', href: '/admin/text-manager' },
      { icon: '🔒', label: 'Privacitat RGPD', href: '/admin/privacy' },
    ],
  },
  {
    title: 'Configuració',
    defaultOpen: false,
    items: [
      { icon: '⚙️', label: 'General', href: '/admin/settings' },
      { icon: '📊', label: 'Estadístiques web', href: '/admin/stats' },
      { icon: '🗺️', label: 'Cobertura', href: '/admin/coverage' },
      { icon: '🎛️', label: 'Features', href: '/admin/features' },
      { icon: '📡', label: 'Activitat', href: '/admin/activity' },
      { icon: '🔄', label: 'Crons', href: '/admin/crons' },
      { icon: '🎨', label: 'Tema admin', href: '/admin/css-manager' },
      { icon: '🛠️', label: 'Scripts i eines', href: '/admin/scripts' },
    ],
  },
];

