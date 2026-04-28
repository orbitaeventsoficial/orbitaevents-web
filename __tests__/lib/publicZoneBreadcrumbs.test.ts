import { describe, expect, it } from 'vitest';
import { buildPublicZoneBreadcrumbs } from '@/lib/publicZoneBreadcrumbs';

const tCommon = (key: string): string => {
  const map: Record<string, string> = {
    'nav.home': 'Inici',
    'nav.services': 'Serveis',
    'nav.weddings': 'Casaments',
    'nav.discomovil': 'Discomòbil',
    'nav.parties': 'Festes',
  };
  return map[key] ?? key;
};

describe('buildPublicZoneBreadcrumbs', () => {
  it('builds the canonical 4-entry breadcrumb for bodas zonals', () => {
    const items = buildPublicZoneBreadcrumbs({
      service: 'bodas',
      zoneSlug: 'dj-bodas-girona',
      breadcrumbLabel: 'DJ Bodas Girona',
      tCommon,
    });

    expect(items).toEqual([
      { name: 'Inici', url: '/' },
      { name: 'Serveis', url: '/servicios' },
      { name: 'Casaments', url: '/servicios/bodas' },
      { name: 'DJ Bodas Girona', url: '/servicios/dj-bodas-girona' },
    ]);
  });

  it('uses the discomovil base path and nav key', () => {
    const items = buildPublicZoneBreadcrumbs({
      service: 'discomovil',
      zoneSlug: 'discomovil-maresme',
      breadcrumbLabel: 'Discomòbil Maresme',
      tCommon,
    });

    expect(items[2]).toEqual({ name: 'Discomòbil', url: '/servicios/discomovil' });
    expect(items[3]).toEqual({ name: 'Discomòbil Maresme', url: '/servicios/discomovil-maresme' });
  });

  it('uses the parties nav key for fiestas zonals', () => {
    const items = buildPublicZoneBreadcrumbs({
      service: 'fiestas',
      zoneSlug: 'dj-fiestas-barcelona',
      breadcrumbLabel: 'DJ Fiestas Barcelona',
      tCommon,
    });

    expect(items[2]).toEqual({ name: 'Festes', url: '/servicios/fiestas' });
    expect(items[3].url).toBe('/servicios/dj-fiestas-barcelona');
  });

  it('always returns exactly four entries in canonical order', () => {
    const items = buildPublicZoneBreadcrumbs({
      service: 'bodas',
      zoneSlug: 'dj-bodas-osona',
      breadcrumbLabel: 'Osona',
      tCommon,
    });

    expect(items).toHaveLength(4);
    expect(items[0].url).toBe('/');
    expect(items[1].url).toBe('/servicios');
  });
});
