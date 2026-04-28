import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import StandaloneServicePage from '@/app/components/public/StandaloneServicePage';
import { getSiteUrl } from '@/lib/site';
import { STANDALONE_SERVICE_SEO } from '@/lib/standaloneServiceSeo';

const SEO = STANDALONE_SERVICE_SEO.alquiler;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const title = t('items.alquiler.name');
  const description = t('items.alquiler.desc');

  return {
    title,
    description,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/alquiler' },
    openGraph: {
      title,
      description,
      url: '/servicios/alquiler',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

const faqItems = [
  {
    q: '¿Qué equipo de sonido tenéis disponible para alquilar?',
    a: 'Alquilamos equipo profesional: 2 altavoces Electro-Voice ETX de 2000W (4000W total), controladora Pioneer DDJ REV7, iluminación LED (cabezas móviles 150W, multiefectos), subwoofer de refuerzo y máquina de humo. Todo homologado y en perfecto estado.',
  },
  {
    q: '¿El alquiler incluye técnico o solo el equipo?',
    a: 'Ofrecemos las dos opciones. Puedes alquilar el equipo solo (self-service) o con técnico operador incluido para que se encargue del montaje, operación y desmontaje. Recomendamos la opción con técnico para garantizar el mejor resultado.',
  },
  {
    q: '¿Cuánto tiempo mínimo es el alquiler del equipo?',
    a: 'El alquiler mínimo es de 4 horas. A partir de ahí, puedes ampliar por horas adicionales. El precio incluye transporte, montaje y desmontaje en toda Catalunya.',
  },
  {
    q: '¿Podéis alquilar solo el equipo de iluminación sin sonido?',
    a: 'Sí, ofrecemos alquiler por separado de sonido e iluminación. Si ya tienes equipo de sonido propio, podemos complementarlo solo con la iluminación LED o cabezas móviles.',
  },
  {
    q: '¿Qué diferencia hay entre el alquiler y contratar un pack completo con DJ?',
    a: 'El alquiler es ideal si ya tienes DJ o locutores propios y necesitas el equipo técnico. Los packs completos incluyen DJ profesional + equipo + montaje. Si dudas, te asesoramos sin compromiso.',
  },
];

export default async function AlquilerPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  return (
    <StandaloneServicePage
      slug="alquiler"
      itemKey="alquiler"
      locale={locale}
      seo={SEO}
      faqItems={faqItems}
    />
  );
}
