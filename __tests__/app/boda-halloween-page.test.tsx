import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BodaHalloweenPage from '@/app/[locale]/boda-halloween/page';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const dicts: Record<string, Record<string, string>> = {
      bodaHalloween: {
        badge: 'Especial Halloween',
        heroTitle1: 'Boda',
        heroTitle2: 'Halloween',
        heroTitle3: 'memorable',
        heroSubtitle: 'Ambientació i DJ.',
        ctaBudget: 'Demanar pressupost',
        ctaWhatsapp: 'Parlar per WhatsApp',
        trustEvents: 'events',
        trustRecommend: 'recomanen',
        trustResponse: 'Resposta ràpida',
        featuresTitle: 'Què inclou',
        featuresSubtitle: 'Tot el necessari',
        faqTitle: 'FAQ',
        finalCtaTitle: 'Preparats?',
        finalCtaSubtitle: 'Parlem del vostre dia.',
        finalCtaBudget: 'Demanar pressupost',
        finalCtaCall: 'Trucar',
      },
      bodaHalloweenPage: {
        'meta.title': 'Meta title',
        'meta.description': 'Meta description',
        'meta.ogTitle': 'OG title',
        'meta.ogDescription': 'OG description',
      },
      whatsappMessages: {
        bodas: 'Hola! Voldria informació per a una boda Halloween.',
      },
    };
    const dict = dicts[namespace] ?? {};
    return (key: string) => dict[key] ?? key;
  },
}));

describe('BodaHalloweenPage', () => {
  it('uses the canonical WhatsApp helper for the hero CTA', async () => {
    const ui = await BodaHalloweenPage({ params: { locale: 'ca' } });

    render(ui);

    expect(screen.getByRole('link', { name: 'Parlar per WhatsApp' })).toHaveAttribute(
      'href',
      WHATSAPP_URL_WITH_MESSAGE('Hola! Voldria informació per a una boda Halloween.'),
    );
  });
});
