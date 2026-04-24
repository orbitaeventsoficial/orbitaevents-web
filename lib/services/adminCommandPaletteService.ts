import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

export type AdminPaletteNavItem = {
  icon: string;
  label: string;
  href: string;
  description?: string;
};

export type AdminPaletteNavSection = {
  title: string;
  items: AdminPaletteNavItem[];
};

export type AdminPaletteRecentItem = {
  href: string;
  label: string;
  type: string;
};

export type AdminPaletteLeadResult = {
  id: string;
  name: string;
  status: string;
};

export type AdminPaletteBookingResult = {
  id: string;
  reference: string;
  clientName: string;
  statusLabel: string;
};

export type AdminPaletteCustomerResult = {
  id: string;
  name: string;
  totalEvents: number;
};

export type AdminPaletteSearchResults = {
  leads: AdminPaletteLeadResult[];
  bookings: AdminPaletteBookingResult[];
  customers: AdminPaletteCustomerResult[];
};

export type AdminPaletteCommandItem = {
  href: string;
  label: string;
  icon: string;
  type: string;
  description?: string;
  keywords: string;
};

export type AdminPaletteEntry = {
  key: string;
  href: string;
  label: string;
  meta: string;
  type: string;
  icon: string;
};

export const ADMIN_COMMAND_PALETTE_BASE_COMMANDS: AdminPaletteCommandItem[] = [
  {
    href: '/admin/inbox/compose',
    label: 'Nou email',
    icon: '✉️',
    type: 'Accio',
    description: 'Obre directament el redactor per enviar un correu.',
    keywords: 'nou email redactar correu compose inbox',
  },
  {
    href: '/admin/intake',
    label: 'Entrada rapida',
    icon: '⚡',
    type: 'Accio',
    description: 'Crea una entrada nova fora del flux habitual.',
    keywords: 'entrada rapida lead intake crear nova',
  },
  {
    href: '/admin/manual',
    label: 'Obrir manual',
    icon: '📖',
    type: 'Accio',
    description: 'Guia operativa de marketing, CRM i execucio.',
    keywords: 'manual ajuda guia playbook marketing',
  },
  {
    href: '/admin/reporting',
    label: 'Veure reporting executiu',
    icon: '📊',
    type: 'Accio',
    description: 'KPIs, marge, conversio i tendencia mensual.',
    keywords: 'reporting executiu informe dashboard kpi',
  },
];

export function buildAdminCommandItems(
  priorityItems: AdminPaletteNavItem[],
  navSections: AdminPaletteNavSection[],
  baseCommands: AdminPaletteCommandItem[] = ADMIN_COMMAND_PALETTE_BASE_COMMANDS,
): AdminPaletteCommandItem[] {
  const deduped = new Map<string, AdminPaletteCommandItem>();

  for (const item of priorityItems) {
    deduped.set(item.href, {
      href: item.href,
      label: item.label,
      icon: item.icon,
      type: 'Prioritat',
      description: item.description,
      keywords: `${item.label} ${item.description ?? ''} prioritat`,
    });
  }

  for (const item of baseCommands) {
    deduped.set(item.href, item);
  }

  for (const section of navSections) {
    for (const item of section.items) {
      if (deduped.has(item.href)) continue;
      deduped.set(item.href, {
        href: item.href,
        label: item.label,
        icon: item.icon,
        type: section.title,
        description: item.description,
        keywords: `${item.label} ${section.title} ${item.description ?? ''}`,
      });
    }
  }

  return [...deduped.values()];
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterAdminCommandItems(
  items: AdminPaletteCommandItem[],
  query: string,
  limit = 8,
): AdminPaletteCommandItem[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return items.slice(0, limit);

  return items
    .filter((item) => normalizeSearchText(`${item.label} ${item.keywords}`).includes(normalizedQuery))
    .slice(0, limit);
}

export function buildAdminCommandEntries(items: AdminPaletteCommandItem[]): AdminPaletteEntry[] {
  return items.map((item) => ({
    key: `command-${item.href}`,
    href: item.href,
    label: item.label,
    meta: item.description ?? item.type,
    type: item.type,
    icon: item.icon,
  }));
}

export function buildAdminSearchEntries(results: AdminPaletteSearchResults): AdminPaletteEntry[] {
  return [
    ...results.leads.map((lead) => ({
      key: `lead-${lead.id}`,
      href: buildLeadWorkspaceHref(lead.id),
      label: lead.name,
      meta: lead.status,
      type: 'Entrada',
      icon: '👥',
    })),
    ...results.bookings.map((booking) => ({
      key: `booking-${booking.id}`,
      href: `/admin/bookings/${booking.id}`,
      label: `${booking.reference} · ${booking.clientName}`,
      meta: booking.statusLabel,
      type: 'Reserva',
      icon: '📋',
    })),
    ...results.customers.map((customer) => ({
      key: `customer-${customer.id}`,
      href: `/admin/clientes/${customer.id}`,
      label: customer.name,
      meta: `${customer.totalEvents} esdeveniments`,
      type: 'Client',
      icon: '👤',
    })),
  ];
}

export function buildAdminRecentEntries(items: AdminPaletteRecentItem[]): AdminPaletteEntry[] {
  return items.map((item) => ({
    key: `recent-${item.href}`,
    href: item.href,
    label: item.label,
    meta: 'Obrir de nou',
    type: item.type,
    icon: '🕘',
  }));
}

export function buildAdminSelectableEntries(input: {
  isSearchingEntities: boolean;
  commandEntries: AdminPaletteEntry[];
  searchEntries: AdminPaletteEntry[];
  recentEntries: AdminPaletteEntry[];
}): AdminPaletteEntry[] {
  if (input.isSearchingEntities) {
    return [...input.commandEntries, ...input.searchEntries];
  }

  return [...input.recentEntries, ...input.commandEntries];
}
