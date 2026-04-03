// app/[locale]/servicios/dj-fiestas-barcelona/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';
import { getSiteUrl } from '@/lib/site';
import { getPublicServiceHeroImage, getPublicServiceGalleryImages } from '@/lib/services/publicServiceMediaService';


const MIN_PRICE = getMinPriceByService('fiestas');

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');
  return {
  title: `DJ Fiestas Barcelona | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para fiestas en Barcelona desde ${MIN_PRICE}€. Cumpleaños, aniversarios, despedidas y celebraciones privadas. Equipo profesional, presupuesto en 2h.`,
  keywords: ['DJ fiestas Barcelona', 'DJ fiesta cumpleaños Barcelona', 'DJ fiesta privada Barcelona', 'DJ Barcelona precio', 'contratar DJ Barcelona'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-fiestas-barcelona' },
  openGraph: {
    title: `DJ Fiestas Barcelona | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para fiestas privadas en Barcelona. Cumpleaños, despedidas y celebraciones.',
    url: '/servicios/dj-fiestas-barcelona',
    images: [{ url: heroImage, alt: 'DJ Fiestas Barcelona - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const barcelonaTowns = ['Barcelona', "L'Hospitalet de Llobregat", 'Badalona', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Esplugues de Llobregat', 'Gavà', 'Viladecans', 'Castelldefels', 'Rubí', 'Molins de Rei'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasBarcelonaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

  const faqItems = [
    {
      q: '¿Cuánto cuesta contratar un DJ para una fiesta en Barcelona?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash para fiestas de hasta 50 personas. Los packs estándar empiezan desde 350€ para 3 horas. Incluye DJ, equipo de sonido 4000W e iluminación.`,
    },
    {
      q: '¿Hacéis DJ para cumpleaños en Barcelona?',
      a: 'Sí, los cumpleaños son uno de nuestros eventos más frecuentes en Barcelona. Desde pequeñas reuniones hasta grandes celebraciones, nos adaptamos a cualquier tamaño y presupuesto.',
    },
    {
      q: '¿Qué diferencia hay entre un DJ para bodas y uno para fiestas?',
      a: 'El DJ de fiestas tiene un enfoque más dinámico y open format: se adapta al momento, acepta peticiones y lleva la energía de la sala. No hay horarios estrictos ni protocolo, ¡solo fiesta!',
    },
    {
      q: '¿El equipo de sonido es realmente profesional?',
      a: 'Sí. Llevamos 2 altavoces Electro-Voice ETX de 2000W (4000W total) y controladora Pioneer DDJ REV7. El mismo equipo que usamos en bodas y eventos de empresa. Nada de altavoces domésticos.',
    },
    {
      q: '¿Podemos hacer peticiones durante la fiesta?',
      a: 'Por supuesto. Las peticiones son bienvenidas en directo. También puedes enviarnos una playlist con tus canciones favoritas antes de la fiesta para que el DJ las prepare.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Barcelona',
    zoneSlug: 'barcelona',
    service: 'fiestas',
    heroTitle: 'DJ Fiestas Barcelona',
    heroSubtitle: 'Cumpleaños · Despedidas · Aniversarios · Celebraciones Privadas',
    minPrice: MIN_PRICE,
    towns: barcelonaTowns,
    highlights: ['DJ fiestas Barcelona precio', 'DJ cumpleaños Barcelona', 'DJ fiesta privada Barcelona', 'contratar DJ Barcelona'],
    description: `DJ profesional para todo tipo de fiestas en Barcelona. Equipo completo, open format y adaptación total a tu celebración.`,
    whyChooseUs: [
      'Open format: Ponemos lo que tú y tus invitados queráis',
      'Desplazamiento incluido a Barcelona y área metropolitana',
      'Experiencia: Más de 200 fiestas privadas realizadas',
      'Flexibilidad: Nos adaptamos al espacio y al horario',
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
        { name: tCommon('nav.parties'), url: '/servicios/fiestas' },
        { name: 'DJ Fiestas Barcelona', url: '/servicios/dj-fiestas-barcelona' },
      ]} />
      <ServiceJsonLD
        name="DJ Fiestas Barcelona"
        slugPath="/servicios/dj-fiestas-barcelona"
        description={`DJ profesional para fiestas privadas en Barcelona. Cumpleaños, despedidas y celebraciones. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ fiestas Barcelona', 'DJ cumpleaños Barcelona', 'DJ fiesta privada Barcelona']}
        areaServed={barcelonaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}

