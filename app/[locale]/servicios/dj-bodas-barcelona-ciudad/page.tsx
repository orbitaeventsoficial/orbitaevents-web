// app/[locale]/servicios/dj-bodas-barcelona-ciudad/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Barcelona Ciudad | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en Barcelona ciudad desde ${MIN_PRICE}€. Eixample, Gràcia, Sarrià, Ciutat Vella. Desplazamiento incluido en toda la ciudad.`,
  keywords: ['DJ bodas Barcelona', 'DJ bodas Eixample', 'DJ bodas Gràcia', 'DJ bodas Sarrià', 'bodas Barcelona ciudad'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-barcelona-ciudad' },
  openGraph: {
    title: `DJ Bodas Barcelona Ciudad | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Barcelona ciudad. Todos los distritos con desplazamiento incluido.',
    url: '/servicios/dj-bodas-barcelona-ciudad',
    images: [{ url: '/img/portfolio/bodas/bodas-01.avif', alt: 'DJ Bodas Barcelona Ciudad - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const barcelonaCiudadDistricts = ['Eixample', 'Gràcia', 'Sarrià-Sant Gervasi', 'Ciutat Vella', 'Sant Martí', 'Les Corts', 'Sants-Montjuïc', 'Horta-Guinardó', 'Nou Barris', 'Sant Andreu', 'Pedralbes', 'Poblenou', 'El Born', 'Barceloneta'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasBarcelonaCiudadPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-barcelona-ciudad' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const faqItems = [];
  for (let i = 0; i < 5; i++) {
    try {
      const q = t(`faq.${i}.q`);
      const a = t(`faq.${i}.a`);
      if (q && a && !q.includes('faq.')) {
        faqItems.push({ q, a });
      }
    } catch { break; }
  }

  const zoneConfig: ZoneConfig = {
    zone: 'Barcelona Ciudad',
    zoneSlug: 'barcelona-ciudad',
    service: 'bodas',
    heroTitle: 'DJ Bodas Barcelona Ciudad',
    heroSubtitle: 'Eixample · Gràcia · Sarrià · Ciutat Vella · Todos los distritos',
    minPrice: MIN_PRICE,
    towns: barcelonaCiudadDistricts,
    highlights: ['Todos los distritos', 'Desplazamiento incluido', 'Hoteles y restaurantes', 'Espacios emblemáticos'],
    description: `DJ profesional para bodas en Barcelona ciudad. Cubrimos todos los distritos con desplazamiento incluido.`,
    whyChooseUs: [
      'Toda la ciudad: Eixample, Gràcia, Sarrià y más',
      'Desplazamiento incluido: Sin costes adicionales',
      'Espacios urbanos: Hoteles, restaurantes, terrazas y rooftops',
      'Experiencia local: Conocemos los mejores venues de Barcelona',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
        { name: 'DJ Bodas Barcelona Ciudad', url: '/servicios/dj-bodas-barcelona-ciudad' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Barcelona Ciudad"
        slugPath="/servicios/dj-bodas-barcelona-ciudad"
        description={`DJ profesional para bodas en Barcelona ciudad. Desplazamiento incluido. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Barcelona', 'DJ bodas Eixample', 'DJ bodas Gràcia']}
        areaServed={barcelonaCiudadDistricts.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
