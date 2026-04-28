import { describe, expect, it } from 'vitest';
import {
  ADMIN_COMMAND_PALETTE_BASE_COMMANDS,
  buildAdminCommandEntries,
  buildAdminCommandItems,
  buildAdminRecentEntries,
  buildAdminSearchEntries,
  buildAdminSelectableEntries,
  filterAdminCommandItems,
  type AdminPaletteNavItem,
  type AdminPaletteNavSection,
} from '@/lib/services/adminCommandPaletteService';

const PRIORITY_ITEMS: AdminPaletteNavItem[] = [
  { icon: '📥', label: 'Entrades', href: '/admin/leads', description: 'Revisa consultes.' },
  { icon: '👤', label: 'Clients', href: '/admin/clientes', description: 'Historial de clients.' },
];

const NAV_SECTIONS: AdminPaletteNavSection[] = [
  {
    title: 'Operacions',
    items: [
      { icon: '📥', label: 'Entrades', href: '/admin/leads', description: 'Duplicat de prioritat.' },
      { icon: '📋', label: 'Reserves', href: '/admin/bookings', description: 'Gestiona reserves.' },
    ],
  },
  {
    title: 'Configuracio',
    items: [
      { icon: '📖', label: 'Manual', href: '/admin/manual', description: 'Duplicat de base command.' },
      { icon: '🎛️', label: 'Features', href: '/admin/features', description: 'Flags de funcionalitat.' },
    ],
  },
];

describe('adminCommandPaletteService', () => {
  it('deduplica per href i prioritza priority/base commands sobre navegacio', () => {
    const items = buildAdminCommandItems(PRIORITY_ITEMS, NAV_SECTIONS, ADMIN_COMMAND_PALETTE_BASE_COMMANDS);

    expect(items.find((item) => item.href === '/admin/leads')?.type).toBe('Prioritat');
    expect(items.find((item) => item.href === '/admin/manual')?.type).toBe('Accio');
    expect(items.filter((item) => item.href === '/admin/leads')).toHaveLength(1);
    expect(items.filter((item) => item.href === '/admin/manual')).toHaveLength(1);
  });

  it('afegeix items de navegacio no duplicats', () => {
    const items = buildAdminCommandItems(PRIORITY_ITEMS, NAV_SECTIONS, ADMIN_COMMAND_PALETTE_BASE_COMMANDS);

    expect(items.find((item) => item.href === '/admin/bookings')?.type).toBe('Operacions');
    expect(items.find((item) => item.href === '/admin/features')?.type).toBe('Configuracio');
  });

  it('filtra per query i limita resultats', () => {
    const items = buildAdminCommandItems(PRIORITY_ITEMS, NAV_SECTIONS, ADMIN_COMMAND_PALETTE_BASE_COMMANDS);
    const filtered = filterAdminCommandItems(items, 'manual', 2);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].href).toBe('/admin/manual');
  });


  it('troba coincidències ignorant accents', () => {
    const items = buildAdminCommandItems([], [], [
      { href: '/admin/help', label: 'Acció ràpida', icon: '⚡', type: 'Accio', description: 'Màrqueting i acció', keywords: 'màrqueting acció ràpida' },
    ]);

    const byAccio = filterAdminCommandItems(items, 'accio', 5);
    const byMarketing = filterAdminCommandItems(items, 'marqueting', 5);

    expect(byAccio).toHaveLength(1);
    expect(byAccio[0].href).toBe('/admin/help');
    expect(byMarketing).toHaveLength(1);
    expect(byMarketing[0].href).toBe('/admin/help');
  });

  it('retorna els primers resultats quan no hi ha query', () => {
    const items = buildAdminCommandItems(PRIORITY_ITEMS, NAV_SECTIONS, ADMIN_COMMAND_PALETTE_BASE_COMMANDS);
    const filtered = filterAdminCommandItems(items, '', 3);

    expect(filtered).toHaveLength(3);
    expect(filtered[0].href).toBe('/admin/leads');
  });

  it('construeix entries de cerca per leads, reserves i clients', () => {
    const entries = buildAdminSearchEntries({
      leads: [{ id: 'l1', name: 'Maria', status: 'NEW' }],
      bookings: [{ id: 'b1', reference: 'OE-1', clientName: 'Maria', statusLabel: 'Confirmada' }],
      customers: [{ id: 'c1', name: 'Maria', totalEvents: 3 }],
    });

    expect(entries).toHaveLength(3);
    expect(entries[0].href).toBe('/admin/leads/l1');
    expect(entries[1].href).toBe('/admin/bookings/b1');
    expect(entries[2].href).toBe('/admin/clientes/c1');
  });

  it('construeix entries de recents amb copy coherent', () => {
    const entries = buildAdminRecentEntries([{ href: '/admin/leads/1', label: 'Lead 1', type: 'Entrada' }]);

    expect(entries[0].meta).toBe('Obrir de nou');
    expect(entries[0].icon).toBe('🕘');
  });

  it('combina recents + comandes fora de cerca d’entitats', () => {
    const entries = buildAdminSelectableEntries({
      isSearchingEntities: false,
      recentEntries: [{ key: 'r1', href: '/r', label: 'Recent', meta: 'Obrir', type: 'Recent', icon: '🕘' }],
      commandEntries: [{ key: 'c1', href: '/c', label: 'Comanda', meta: 'Exec', type: 'Accio', icon: '⚡' }],
      searchEntries: [{ key: 's1', href: '/s', label: 'Search', meta: 'Entitat', type: 'Entrada', icon: '👥' }],
    });

    expect(entries.map((entry) => entry.key)).toEqual(['r1', 'c1']);
  });

  it('combina comandes + resultats reals quan hi ha cerca d’entitats', () => {
    const entries = buildAdminSelectableEntries({
      isSearchingEntities: true,
      recentEntries: [{ key: 'r1', href: '/r', label: 'Recent', meta: 'Obrir', type: 'Recent', icon: '🕘' }],
      commandEntries: [{ key: 'c1', href: '/c', label: 'Comanda', meta: 'Exec', type: 'Accio', icon: '⚡' }],
      searchEntries: [{ key: 's1', href: '/s', label: 'Search', meta: 'Entitat', type: 'Entrada', icon: '👥' }],
    });

    expect(entries.map((entry) => entry.key)).toEqual(['c1', 's1']);
  });

  it('construeix command entries preservant meta i tipus', () => {
    const entries = buildAdminCommandEntries([
      { href: '/admin/manual', label: 'Manual', icon: '📖', type: 'Accio', description: 'Guia', keywords: 'manual guia' },
    ]);

    expect(entries[0]).toMatchObject({
      key: 'command-/admin/manual',
      meta: 'Guia',
      type: 'Accio',
      icon: '📖',
    });
  });

  it('buildAdminCommandItems amb arrays buits retorna només els base commands', () => {
    const items = buildAdminCommandItems([], [], ADMIN_COMMAND_PALETTE_BASE_COMMANDS);

    expect(items).toHaveLength(ADMIN_COMMAND_PALETTE_BASE_COMMANDS.length);
    expect(items.every((item) => item.type === 'Accio')).toBe(true);
  });

  it('filterAdminCommandItems amb limit 0 retorna array buit', () => {
    const items = buildAdminCommandItems(PRIORITY_ITEMS, NAV_SECTIONS, ADMIN_COMMAND_PALETTE_BASE_COMMANDS);

    expect(filterAdminCommandItems(items, '', 0)).toHaveLength(0);
    expect(filterAdminCommandItems(items, 'entrades', 0)).toHaveLength(0);
  });

  it('buildAdminSearchEntries amb results totalment buits retorna array buit', () => {
    const entries = buildAdminSearchEntries({ leads: [], bookings: [], customers: [] });

    expect(entries).toEqual([]);
  });
});
