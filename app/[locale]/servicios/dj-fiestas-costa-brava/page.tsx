// app/[locale]/servicios/dj-fiestas-costa-brava/page.tsx
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
  title: `DJ Fiestas Costa Brava | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para fiestas en la Costa Brava desde ${MIN_PRICE}€. Lloret de Mar, Tossa, Platja d'Aro, Roses y toda la costa. Equipo profesional resistente a exteriores.`,
  keywords: ['DJ fiestas Costa Brava', 'DJ fiesta Lloret de Mar', 'DJ fiesta Tossa de Mar', "DJ fiesta Platja d'Aro", 'DJ cumpleaños Costa Brava'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-fiestas-costa-brava' },
  openGraph: {
    title: `DJ Fiestas Costa Brava | Desde ${MIN_PRICE}€`,
    description: "DJ profesional para fiestas en la Costa Brava. Lloret, Tossa, Platja d'Aro y toda la costa.",
    url: '/servicios/dj-fiestas-costa-brava',
    images: [{ url: heroImage, alt: 'DJ Fiestas Costa Brava - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const costaBravaTowns = ["Lloret de Mar", 'Tossa de Mar', "Platja d'Aro", 'Roses', 'Cadaqués', 'Palamós', 'Sant Antoni de Calonge', 'Sant Feliu de Guíxols', 'Blanes', 'Calella de Palafrugell', 'Begur', 'Empuriabrava'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasCostaBravaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

  const faqItems = [
    {
      q: '¿Hacéis DJ para fiestas en la Costa Brava?',
      a: `Sí, cubrimos toda la Costa Brava: Lloret de Mar, Tossa, Platja d'Aro, Roses, Cadaqués, Palamós, Begur y toda la costa. Desplazamiento incluido desde ${MIN_PRICE}€.`,
    },
    {
      q: '¿Cuánto cuesta contratar un DJ en Lloret o Tossa de Mar?',
      a: `El desplazamiento a Lloret, Tossa y el resto de la Costa Brava está incluido en nuestros packs. Precio desde ${MIN_PRICE}€ (Oferta Flash) o desde 350€ para fiestas estándar.`,
    },
    {
      q: '¿Podéis hacer la fiesta al aire libre en la Costa Brava?',
      a: 'Sí, somos expertos en fiestas de exterior. Llevamos equipo resistente a la humedad del mar y adaptado para terrazas, jardines, villas y espacios al aire libre de la Costa Brava.',
    },
    {
      q: "¿Cubrís Platja d'Aro, Roses y Cadaqués?",
      a: "Sí, todos estos municipios y más. Cubrimos toda la Costa Brava desde Blanes hasta Cadaqués, incluyendo Platja d'Aro, Sant Feliu de Guíxols, Palamós, Roses y Empuriabrava.",
    },
    {
      q: '¿El equipo es resistente a la humedad del mar y el viento?',
      a: 'Sí. Nuestro equipo Electro-Voice ETX está preparado para exteriores. Protegemos cables y electrónica contra la humedad marina y tenemos Plan B para adaptar el montaje si hay viento.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Costa Brava',
    zoneSlug: 'costa-brava',
    service: 'fiestas',
    heroTitle: 'DJ Fiestas Costa Brava',
    heroSubtitle: "Lloret · Tossa · Platja d'Aro · Roses · Cadaqués · Palamós",
    minPrice: MIN_PRICE,
    towns: costaBravaTowns,
    highlights: ['DJ fiestas Costa Brava precio', 'DJ fiesta Lloret de Mar', 'DJ fiesta Tossa', 'DJ cumpleaños Costa Brava'],
    description: `DJ profesional para fiestas privadas en la Costa Brava. Especialistas en exterior y fiestas de verano en la costa.`,
    whyChooseUs: [
      'Expertos en exterior: Equipo resistente al mar',
      'Toda la Costa Brava cubierta: De Blanes a Cadaqués',
      'Desplazamiento incluido: Sin recargos por distancia',
      'Plan B preparado: Soluciones ante cambios de tiempo',
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
        { name: 'DJ Fiestas Costa Brava', url: '/servicios/dj-fiestas-costa-brava' },
      ]} />
      <ServiceJsonLD
        name="DJ Fiestas Costa Brava"
        slugPath="/servicios/dj-fiestas-costa-brava"
        description={`DJ profesional para fiestas privadas en la Costa Brava. Exterior, villas y terrazas. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ fiestas Costa Brava', 'DJ fiesta Lloret de Mar', 'DJ fiesta exterior Costa Brava']}
        areaServed={costaBravaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}

