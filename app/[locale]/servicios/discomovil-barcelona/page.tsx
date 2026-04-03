// app/[locale]/servicios/discomovil-barcelona/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';
import { getSiteUrl } from '@/lib/site';
import { getPublicServiceHeroImage, getPublicServiceGalleryImages } from '@/lib/services/publicServiceMediaService';


const MIN_PRICE = getMinPriceByService('discomovil');

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');
  return {
  title: `Discomóvil Barcelona | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `Discomóvil en Barcelona desde ${MIN_PRICE}€. DJ profesional para fiestas privadas, cumpleaños y celebraciones. Sonido 4000W + iluminación completa. Presupuesto en 2h.`,
  keywords: ['discomovil Barcelona', 'discomóvil precio Barcelona', 'DJ fiesta Barcelona', 'discomóvil cumpleaños Barcelona', 'alquiler discomovil Barcelona'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/discomovil-barcelona' },
  openGraph: {
    title: `Discomóvil Barcelona | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para fiestas en Barcelona. Equipo completo de sonido e iluminación.',
    url: '/servicios/discomovil-barcelona',
    images: [{ url: heroImage, alt: 'Discomóvil Barcelona - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const barcelonaTowns = ['Barcelona', "L'Hospitalet de Llobregat", 'Badalona', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Esplugues de Llobregat', 'Gavà', 'Viladecans', 'Castelldefels', 'Sant Feliu de Llobregat', 'Molins de Rei'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilBarcelonaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Cuánto cuesta un discomóvil en Barcelona?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash para fiestas de hasta 50 personas. Los packs estándar empiezan desde 350€ para 3 horas con equipo completo, DJ profesional, sonido 4000W e iluminación.`,
    },
    {
      q: '¿El desplazamiento a Barcelona está incluido?',
      a: 'Sí, el desplazamiento a Barcelona capital y área metropolitana está incluido sin coste adicional en todos nuestros packs. Sin sorpresas en el presupuesto final.',
    },
    {
      q: '¿Podéis montar el equipo en pisos, terrazas o locales de Barcelona?',
      a: 'Sí, nos adaptamos a cualquier espacio: pisos, terrazas, jardines privados, locales alquilados... El montaje lleva unos 45 minutos y desmontamos al acabar.',
    },
    {
      q: '¿Qué tipos de fiestas hacéis con discomóvil en Barcelona?',
      a: 'Cumpleaños, aniversarios, despedidas de soltero/a, fiestas de fin de curso, reuniones familiares, fiestas temáticas... Cualquier celebración privada en Barcelona.',
    },
    {
      q: '¿Podemos hacer peticiones de canciones durante la fiesta?',
      a: 'Por supuesto. En todos nuestros packs aceptamos peticiones en directo. También puedes enviarnos una lista de canciones favoritas con antelación para que el DJ las prepare.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Barcelona',
    zoneSlug: 'barcelona',
    service: 'discomovil',
    heroTitle: 'Discomóvil Barcelona',
    heroSubtitle: 'Eixample · Gràcia · Sants · Horta · Área Metropolitana',
    minPrice: MIN_PRICE,
    towns: barcelonaTowns,
    highlights: ['Discomóvil Barcelona precio', 'DJ fiesta Barcelona', 'Discomóvil cumpleaños', 'DJ fiestas privadas Barcelona'],
    description: `DJ profesional con discomóvil en Barcelona. Equipo completo de sonido e iluminación para cualquier celebración privada.`,
    whyChooseUs: [
      'Desplazamiento incluido: Sin costes extra a Barcelona',
      'Equipo profesional: Pioneer DDJ REV7 + 4000W EV ETX',
      'DJ adaptado: Open format para todos los gustos',
      'Montaje rápido: 45 minutos, sin complicaciones',
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
        { name: tCommon('nav.discomovil'), url: '/servicios/discomovil' },
        { name: 'Discomóvil Barcelona', url: '/servicios/discomovil-barcelona' },
      ]} />
      <ServiceJsonLD
        name="Discomóvil Barcelona"
        slugPath="/servicios/discomovil-barcelona"
        description={`Discomóvil profesional en Barcelona. DJ + equipo completo de sonido e iluminación. Desde ${MIN_PRICE}€.`}
        serviceType={['Discomóvil Barcelona', 'DJ fiestas Barcelona', 'Discomóvil cumpleaños']}
        areaServed={barcelonaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}

