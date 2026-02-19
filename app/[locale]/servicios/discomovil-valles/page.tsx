// app/[locale]/servicios/discomovil-valles/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('discomovil');

export const metadata: Metadata = {
  title: `Discomóvil Vallès | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `Discomóvil en el Vallès desde ${MIN_PRICE}€. Granollers, Mollet, Sabadell, Terrassa, Cerdanyola. DJ profesional + equipo completo para fiestas privadas.`,
  keywords: ['discomovil Vallès', 'discomóvil Granollers', 'DJ fiesta Sabadell', 'discomóvil Terrassa', 'DJ fiestas Vallès Occidental Oriental'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/discomovil-valles' },
  openGraph: {
    title: `Discomóvil Vallès | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para fiestas en el Vallès Occidental y Oriental. Granollers, Sabadell, Terrassa y comarca.',
    url: '/servicios/discomovil-valles',
    images: [{ url: '/img/portfolio/discomovil/discomovil-02.avif', alt: 'Discomóvil Vallès - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const vallesTowns = ['Granollers', 'Mollet del Vallès', 'Sabadell', 'Terrassa', 'Cerdanyola del Vallès', 'Rubí', 'Sant Cugat del Vallès', 'Montcada i Reixac', 'Parets del Vallès', 'La Llagosta', 'Caldes de Montbui', 'Llinars del Vallès'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilVallesPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const faqItems = [
    {
      q: '¿Hacéis discomóvil en el Vallès Occidental y Oriental?',
      a: `Sí, cubrimos todo el Vallès: Granollers, Mollet, Sabadell, Terrassa, Cerdanyola, Sant Cugat y municipios de ambas comarcas. Desplazamiento incluido desde ${MIN_PRICE}€.`,
    },
    {
      q: '¿Cubrís Granollers, Sabadell y Terrassa sin recargo?',
      a: 'Sí. El desplazamiento a estas ciudades y a toda la comarca del Vallès está incluido en el precio del pack. Sin costes adicionales por kilómetros.',
    },
    {
      q: '¿Para cuántos invitados montáis el equipo?',
      a: 'Tenemos packs desde 50 hasta 200+ invitados. Nuestra Oferta Flash es ideal para fiestas de hasta 50 personas. Para eventos más grandes, los packs Party Machine o VIP Experience son los más adecuados.',
    },
    {
      q: '¿Podéis hacer fiestas temáticas en el Vallès?',
      a: 'Sí, nos especializamos en fiestas temáticas: Halloween, años 80, tropical, neón... Preparamos la ambientación musical y visual para que tu fiesta sea única.',
    },
    {
      q: '¿Qué equipo de sonido lleváis al Vallès?',
      a: 'Llevamos 2 altavoces EV ETX de 2000W cada uno (4000W total), controladora Pioneer DDJ REV7, iluminación LED completa y máquina de humo. Todo profesional, nada de equipo doméstico.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Vallès',
    zoneSlug: 'valles',
    service: 'discomovil',
    heroTitle: 'Discomóvil Vallès',
    heroSubtitle: 'Granollers · Mollet · Sabadell · Terrassa · Cerdanyola · Sant Cugat',
    minPrice: MIN_PRICE,
    towns: vallesTowns,
    highlights: ['Discomóvil Vallès precio', 'DJ fiesta Granollers', 'Discomóvil Sabadell', 'DJ fiestas Terrassa'],
    description: `DJ profesional con discomóvil en el Vallès. Somos de Granollers y conocemos la comarca al detalle.`,
    whyChooseUs: [
      'Somos de Granollers: Base en el Vallès Oriental',
      'Toda la comarca cubierta: V. Oriental y Occidental',
      'Desplazamiento incluido: Sin recargos por distancia',
      'Fiestas temáticas: Especialistas en temáticas únicas',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: '/img/portfolio/discomovil/discomovil-02.avif',
    galleryImages: [
      '/img/portfolio/discomovil/discomovil-14.avif',
      '/img/portfolio/discomovil/discomovil-16.avif',
      '/img/portfolio/discomovil/discomovil-18.avif',
      '/img/portfolio/discomovil/discomovil-20.avif',
    ],
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.discomovil'), url: '/servicios/discomovil' },
        { name: 'Discomóvil Vallès', url: '/servicios/discomovil-valles' },
      ]} />
      <ServiceJsonLD
        name="Discomóvil Vallès"
        slugPath="/servicios/discomovil-valles"
        description={`Discomóvil profesional en el Vallès. Base en Granollers. DJ + equipo completo. Desde ${MIN_PRICE}€.`}
        serviceType={['Discomóvil Vallès', 'DJ fiestas Granollers', 'Discomóvil Sabadell Terrassa']}
        areaServed={vallesTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
