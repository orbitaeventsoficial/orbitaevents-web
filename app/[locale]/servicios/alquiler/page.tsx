import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/navigation';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import { getSiteUrl } from '@/lib/site';


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
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const features = t.raw('items.alquiler.features') as string[];

  return (
    <section className="min-h-screen bg-bg-main py-20 relative">
      <ServiceJsonLD
        name="Alquiler de Equipo de Sonido e Iluminación"
        slugPath="/servicios/alquiler"
        description="Alquiler profesional de equipo de sonido (4000W EV ETX) e iluminación LED para eventos. Con o sin técnico. Toda Catalunya."
        serviceType={['Alquiler equipo sonido', 'Alquiler iluminación eventos', 'Alquiler material audiovisual']}
        areaServed={['Barcelona', 'Girona', 'Tarragona', 'Lleida', 'Granollers', 'Mataró', 'Sabadell', 'Terrassa']}
        priceCurrency="EUR"
      />
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
          {t('items.alquiler.name')}
        </h1>
        <p className="text-xl text-white/70 mb-6">
          {t('items.alquiler.tagline')}
        </p>
        <p className="text-base text-white/80 mb-8">
          {t('items.alquiler.desc')}
        </p>

        <ul className="grid gap-3 md:grid-cols-2 mb-10">
          {features.map((feature, index) => (
            <li key={index} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-4">
          <Link href="/contacto" className="btn-primary px-6 py-3">
            {tCommon('buttons.contact')}
          </Link>
          <Link href="/configurador" className="btn-secondary px-6 py-3">
            {tCommon('buttons.configureEvent')}
          </Link>
        </div>
      </div>
      <FAQ items={faqItems} />
    </section>
  );
}
