// app/[locale]/servicios/discomovil-maresme/page.tsx
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
  title: `Discomóvil Maresme | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `Discomóvil en el Maresme desde ${MIN_PRICE}€. Mataró, Calella, Pineda, Arenys, Canet y toda la costa. DJ profesional + equipo completo para fiestas privadas.`,
  keywords: ['discomovil Maresme', 'discomóvil Mataró', 'DJ fiesta Maresme', 'discomóvil Calella', 'DJ fiestas costa Maresme'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/discomovil-maresme' },
  openGraph: {
    title: `Discomóvil Maresme | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para fiestas en el Maresme. Mataró, Calella, Pineda y toda la costa.',
    url: '/servicios/discomovil-maresme',
    images: [{ url: heroImage, alt: 'Discomóvil Maresme - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const maresmeTowns = ['Mataró', 'Calella', 'Pineda de Mar', 'Arenys de Mar', 'Canet de Mar', 'Malgrat de Mar', 'Santa Susanna', 'Caldes d\'Estrac', 'Premià de Mar', 'Vilassar de Mar', 'Argentona', 'Sant Andreu de Llavaneres'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilMaresmePage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Cuánto cuesta un discomóvil en el Maresme?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash. Los packs estándar empiezan desde 350€ para 3 horas. El desplazamiento al Maresme está incluido en todos los packs.`,
    },
    {
      q: '¿Cubrís Mataró, Calella y toda la costa del Maresme?',
      a: 'Sí, cubrimos toda la comarca del Maresme: Mataró, Calella, Pineda de Mar, Arenys de Mar, Canet, Malgrat, Premià y todos los municipios costeros.',
    },
    {
      q: '¿Podéis hacer el discomóvil en casas con jardín o terrazas del Maresme?',
      a: 'Por supuesto. Estamos especializados en fiestas en espacios privados: jardines, terrazas, salones... Nos adaptamos a tu espacio y montamos en 45 minutos.',
    },
    {
      q: '¿Para qué tipos de fiestas ponéis discomóvil en el Maresme?',
      a: 'Cumpleaños, aniversarios, despedidas, fiestas de verano, reuniones familiares... Todo tipo de celebraciones privadas en el Maresme, tanto en interior como exterior.',
    },
    {
      q: '¿Qué diferencia hay entre discomóvil y contratar solo un DJ?',
      a: 'El discomóvil incluye todo: DJ profesional, equipo de sonido completo (4000W), iluminación, montaje y desmontaje. Solo tienes que disfrutar. No necesitas alquilar nada por separado.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Maresme',
    zoneSlug: 'maresme',
    service: 'discomovil',
    heroTitle: 'Discomóvil Maresme',
    heroSubtitle: 'Mataró · Calella · Pineda · Arenys · Canet · Malgrat',
    minPrice: MIN_PRICE,
    towns: maresmeTowns,
    highlights: ['Discomóvil Maresme precio', 'DJ fiesta Mataró', 'Discomóvil Calella', 'DJ fiestas costa Maresme'],
    description: `DJ profesional con discomóvil en el Maresme. Equipo completo para fiestas en la costa.`,
    whyChooseUs: [
      'Somos locales: Conocemos el Maresme a fondo',
      'Desplazamiento incluido: Sin costes extra a la comarca',
      'Especialistas en fiestas de verano y al aire libre',
      'Equipo resistente: Preparado para exteriores costeros',
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
        { name: 'Discomóvil Maresme', url: '/servicios/discomovil-maresme' },
      ]} />
      <ServiceJsonLD
        name="Discomóvil Maresme"
        slugPath="/servicios/discomovil-maresme"
        description={`Discomóvil profesional en el Maresme. DJ + equipo completo para fiestas costeras. Desde ${MIN_PRICE}€.`}
        serviceType={['Discomóvil Maresme', 'DJ fiestas Mataró', 'Discomóvil costa Maresme']}
        areaServed={maresmeTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}

