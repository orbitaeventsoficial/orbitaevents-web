// app/[locale]/servicios/dj-bodas-barcelona-ciudad/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';
import { getSiteUrl } from '@/lib/site';
import { getPublicServiceHeroImage, getPublicServiceGalleryImages } from '@/lib/services/publicServiceMediaService';


const MIN_PRICE = getMinPriceByService('bodas');

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('bodas');
  const galleryImages = await getPublicServiceGalleryImages('bodas');
  return {
  title: `DJ Bodas Barcelona Ciudad | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en Barcelona ciudad desde ${MIN_PRICE}€. Eixample, Gràcia, Sarrià, Ciutat Vella. Desplazamiento incluido en toda la ciudad.`,
  keywords: ['DJ bodas Barcelona', 'DJ bodas Eixample', 'DJ bodas Gràcia', 'DJ bodas Sarrià', 'bodas Barcelona ciudad'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-bodas-barcelona-ciudad' },
  openGraph: {
    title: `DJ Bodas Barcelona Ciudad | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Barcelona ciudad. Todos los distritos con desplazamiento incluido.',
    url: '/servicios/dj-bodas-barcelona-ciudad',
    images: [{ url: heroImage, alt: 'DJ Bodas Barcelona Ciudad - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const barcelonaCiudadDistricts = ['Eixample', 'Gràcia', 'Sarrià-Sant Gervasi', 'Ciutat Vella', 'Sant Martí', 'Les Corts', 'Sants-Montjuïc', 'Horta-Guinardó', 'Nou Barris', 'Sant Andreu', 'Pedralbes', 'Poblenou', 'El Born', 'Barceloneta'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasBarcelonaCiudadPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-barcelona-ciudad' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('bodas');
  const galleryImages = await getPublicServiceGalleryImages('bodas');

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
    // Keywords SEO reals
    highlights: ['DJ boda Barcelona', 'Precio DJ boda', 'Bodas hotel Barcelona', 'DJ rooftop Barcelona'],
    description: `DJ profesional para bodas en Barcelona ciudad. Cubrimos todos los distritos con desplazamiento incluido.`,
    whyChooseUs: [
      'Toda la ciudad: Eixample, Gràcia, Sarrià y más',
      'Hoteles 5 estrellas: W Hotel, Arts, Mandarin Oriental...',
      'Espacios urbanos: Rooftops, restaurantes y terrazas',
      'Conocemos las normativas: Horarios y límites de ruido',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: heroImage,
    galleryImages: galleryImages,
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

