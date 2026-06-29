/**
 * adminNav.ts — font única de la navegació admin (grups/òrgans).
 *
 * Viu aquí (no a layout.tsx) perquè el consumeixen DOS llocs: el shell de
 * navegació (`layout.tsx`) i la capçalera canònica (`AdminPage`, que en deriva
 * l'eyebrow = coordenada d'òrgan). Monocapa: el mapa ruta→òrgan és un de sol.
 */

export type NavItem = { label: string; href: string; secondary?: boolean };
export type NavGroup = { id: string; label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'agenda', label: 'Comercial',
    items: [
      // Nucli comercial pel flux: captar → proposar → reservar → client.
      // (Renombrat «Agenda»→«Comercial» #967: el grup conté tot el comercial,
      // no només calendari. Col·laboradors connectat aquí, abans cable solt.)
      { label: 'Temporada', href: '/admin/leads' },
      { label: 'Reserves', href: '/admin/bookings' },
      { label: 'Pressupostos', href: '/admin/presupuestos' },
      { label: 'Dossiers', href: '/admin/dossiers' },
      { label: 'Clients', href: '/admin/clientes' },
      { label: 'Col·laboradors', href: '/admin/collaborators' },
      { label: 'Arxiu', href: '/admin/leads/arxiu', secondary: true },
    ],
  },
  {
    id: 'events', label: 'Operativa',
    items: [
      { label: 'Economia', href: '/admin/economia' },
      { label: 'Tasques', href: '/admin/tasks' },
      { label: 'Inventari', href: '/admin/inventory' },
    ],
  },
  {
    id: 'cataleg', label: 'Catàleg',
    items: [
      { label: 'Packs', href: '/admin/packs' },
      { label: 'Pricing', href: '/admin/pricing' },
    ],
  },
  {
    id: 'web', label: 'Web',
    items: [
      { label: 'Portfolio', href: '/admin/portfolio' },
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Ressenyes', href: '/admin/ressenyes' },
      { label: 'Social', href: '/admin/social' },
    ],
  },
  {
    id: 'sistema', label: 'Sistema',
    items: [
      { label: 'Configuració', href: '/admin/settings' },
      { label: 'Studio', href: '/admin/studio' },
      { label: 'Manual', href: '/admin/manual' },
      { label: 'Atles', href: '/admin/docs/organisme', secondary: true },
      { label: 'Esquema absolut', href: '/admin/docs/esquema', secondary: true },
      { label: 'Full de ruta', href: '/admin/docs/full-de-ruta', secondary: true },
    ],
  },
];

export function getGroupForPath(pathname: string): string {
  if (
    pathname.startsWith('/admin/leads') ||
    pathname.startsWith('/admin/dossiers') ||
    pathname.startsWith('/admin/clientes') ||
    pathname.startsWith('/admin/collaborators') ||
    pathname.startsWith('/admin/presupuestos') ||
    pathname.startsWith('/admin/intake') ||
    pathname.startsWith('/admin/quick-create') ||
    pathname.startsWith('/admin/sales-ops') ||
    // Workspace fusionat Agenda (#844): bookings i calendari ja no tenen entrada
    // pròpia al nav, però quan algú hi accedeix per URL marquem Agenda activa.
    pathname.startsWith('/admin/bookings') ||
    pathname.startsWith('/admin/calendario')
  ) return 'agenda';
  if (
    pathname.startsWith('/admin/economia') ||
    pathname.startsWith('/admin/cockpit') ||
    pathname.startsWith('/admin/reporting') ||
    pathname.startsWith('/admin/tasks') ||
    pathname.startsWith('/admin/inventory')
  ) return 'events';
  if (
    pathname.startsWith('/admin/packs') ||
    pathname.startsWith('/admin/pricing') ||
    pathname.startsWith('/admin/catalog') ||
    pathname.startsWith('/admin/cost-calculator')
  ) return 'cataleg';
  if (
    pathname.startsWith('/admin/portfolio') ||
    pathname.startsWith('/admin/blog') ||
    pathname.startsWith('/admin/social') ||
    pathname.startsWith('/admin/ressenyes') ||
    pathname.startsWith('/admin/marketing') ||
    pathname.startsWith('/admin/google-reviews') ||
    pathname.startsWith('/admin/campaigns')
  ) return 'web';
  return 'sistema';
}

/** Etiqueta d'òrgan (coordenada canònica) per a una ruta — l'eyebrow del header. */
export function getAdminOrganLabel(pathname: string): string {
  const id = getGroupForPath(pathname);
  return NAV_GROUPS.find((g) => g.id === id)?.label ?? 'Sistema';
}
