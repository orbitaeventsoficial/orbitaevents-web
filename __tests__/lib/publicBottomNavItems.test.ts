import { describe, expect, it } from 'vitest';
import { PUBLIC_BOTTOM_NAV_ITEMS } from '@/lib/constants';

describe('PUBLIC_BOTTOM_NAV_ITEMS', () => {
  it('manté un únic contracte canònic i ordenat per a la navegació inferior pública', () => {
    expect(PUBLIC_BOTTOM_NAV_ITEMS).toEqual([
      { id: 'home', href: '/', icon: 'Home', labelKey: 'home', exactMatch: true },
      { id: 'services', href: '/servicios', icon: 'Briefcase', labelKey: 'services', exactMatch: false },
      { id: 'configurator', href: '/configurador', icon: 'Calculator', labelKey: 'configure', exactMatch: true, highlight: true },
      { id: 'portfolio', href: '/portfolio', icon: 'Image', labelKey: 'portfolio', exactMatch: true },
      { id: 'contact', href: '/contacto', icon: 'MessageCircle', labelKey: 'contact', exactMatch: true },
    ]);
  });

  it('reserva un únic item destacat per al configurador', () => {
    expect(PUBLIC_BOTTOM_NAV_ITEMS.filter((item) => item.highlight)).toEqual([
      { id: 'configurator', href: '/configurador', icon: 'Calculator', labelKey: 'configure', exactMatch: true, highlight: true },
    ]);
  });
});
