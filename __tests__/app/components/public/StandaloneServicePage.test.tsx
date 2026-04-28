import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StandaloneServicePage from '@/app/components/public/StandaloneServicePage';
import type { StandaloneServiceSeoConfig } from '@/lib/standaloneServiceSeo';

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const dictionaries: Record<string, Record<string, string | string[]>> = {
      'pages.servicios': {
        'items.produccion.name': 'Producció Tècnica',
        'items.produccion.tagline': 'Equip i tècnic per al teu event',
        'items.produccion.desc': 'Servei complet de producció.',
        'items.produccion.features': ['Equip de so', 'Iluminació LED', 'Tècnic inclòs'],
      },
      common: {
        'buttons.contact': 'Contactar',
        'buttons.configureEvent': 'Configurar event',
      },
    };
    const dict = dictionaries[namespace] ?? {};
    const tFn = (key: string) => {
      const value = dict[key];
      return typeof value === 'string' ? value : key;
    };
    (tFn as unknown as { raw: (key: string) => unknown }).raw = (key: string) => dict[key] ?? key;
    return tFn;
  },
}));

vi.mock('@/components/seo/ServiceJsonLD', () => ({
  default: ({ name, slugPath }: { name: string; slugPath: string }) => (
    <div data-testid="service-jsonld" data-name={name} data-slug={slugPath} />
  ),
}));

vi.mock('@/components/seo/FAQ', () => ({
  default: ({ items }: { items: Array<{ q: string; a: string }> }) => (
    <div data-testid="faq" data-count={items.length} />
  ),
}));

const seo: StandaloneServiceSeoConfig = {
  metadata: {},
  jsonLd: {
    name: 'Producció Tècnica',
    description: 'Servei complet.',
    serviceType: ['Producció'],
    areaServed: ['Barcelona'],
    priceFrom: '600',
    priceCurrency: 'EUR',
  },
};

describe('StandaloneServicePage', () => {
  it('renders the canonical structure: title, tagline, desc, features list, CTAs and SEO/FAQ widgets', async () => {
    const ui = await StandaloneServicePage({
      slug: 'produccion',
      itemKey: 'produccion',
      locale: 'ca',
      seo,
      faqItems: [
        { q: 'Q1', a: 'A1' },
        { q: 'Q2', a: 'A2' },
      ],
    });

    render(ui);

    expect(screen.getByRole('heading', { level: 1, name: 'Producció Tècnica' })).toBeInTheDocument();
    expect(screen.getByText('Equip i tècnic per al teu event')).toBeInTheDocument();
    expect(screen.getByText('Servei complet de producció.')).toBeInTheDocument();

    expect(screen.getByText('Equip de so')).toBeInTheDocument();
    expect(screen.getByText('Iluminació LED')).toBeInTheDocument();
    expect(screen.getByText('Tècnic inclòs')).toBeInTheDocument();

    const contactCta = screen.getByRole('link', { name: 'Contactar' });
    expect(contactCta).toHaveAttribute('href', '/contacto');

    const configureCta = screen.getByRole('link', { name: 'Configurar event' });
    expect(configureCta).toHaveAttribute('href', '/configurador');

    const jsonld = screen.getByTestId('service-jsonld');
    expect(jsonld).toHaveAttribute('data-slug', '/servicios/produccion');
    expect(jsonld).toHaveAttribute('data-name', 'Producció Tècnica');

    const faq = screen.getByTestId('faq');
    expect(faq).toHaveAttribute('data-count', '2');
  });
});
