import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/navigation';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import { getSiteUrl } from '@/lib/site';
import { STANDALONE_SERVICE_SEO } from '@/lib/standaloneServiceSeo';

const MIN_PRICE = 600;
const SEO = STANDALONE_SERVICE_SEO.produccion;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const title = t('items.produccion.name');
  const description = t('items.produccion.desc');

  return {
    title,
    description,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/produccion' },
    openGraph: {
      title,
      description,
      url: '/servicios/produccion',
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
    q: '¿Qué incluye el servicio de producción técnica?',
    a: `El servicio de producción incluye alquiler de equipo profesional de sonido (4000W EV ETX) e iluminación (4 cabezas móviles LED 150W), transporte, montaje, desmontaje y técnico operador durante todo el evento. Desde ${MIN_PRICE}€.`,
  },
  {
    q: '¿Cuánto cuesta la producción técnica de un evento?',
    a: `Los packs de producción empiezan desde ${MIN_PRICE}€ con un técnico incluido. Para eventos más grandes con doble personal o jornadas completas, disponemos de packs hasta 1.400€. Presupuesto personalizado sin compromiso.`,
  },
  {
    q: '¿El transporte y el montaje están incluidos?',
    a: 'Sí, transporte, montaje y desmontaje del equipo están siempre incluidos en el precio. El técnico llega con antelación para realizar las pruebas de sonido antes del inicio del evento.',
  },
  {
    q: '¿Para qué tipo de eventos es adecuado el servicio de producción?',
    a: 'Conciertos pequeños y medianos, presentaciones de producto, galas de empresa, actos culturales, teatros, jornadas de empresa y cualquier evento que requiera equipo técnico profesional con operador incluido.',
  },
  {
    q: '¿Podéis cubrir eventos al aire libre con el equipo de producción?',
    a: 'Sí, nuestro equipo es apto para exterior. Realizamos eventos en jardines, parques, carpas y espacios al aire libre. Evaluamos cada ubicación para garantizar la calidad de sonido e iluminación.',
  },
];

export default async function ProduccionPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const features = t.raw('items.produccion.features') as string[];

  return (
    <section className="min-h-screen bg-bg-main py-20 relative">
      <ServiceJsonLD
        name={SEO.jsonLd.name}
        slugPath="/servicios/produccion"
        description={SEO.jsonLd.description}
        serviceType={SEO.jsonLd.serviceType}
        areaServed={SEO.jsonLd.areaServed}
        priceFrom={SEO.jsonLd.priceFrom}
        priceCurrency={SEO.jsonLd.priceCurrency}
      />
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
          {t('items.produccion.name')}
        </h1>
        <p className="text-xl text-white/70 mb-6">
          {t('items.produccion.tagline')}
        </p>
        <p className="text-base text-white/80 mb-8">
          {t('items.produccion.desc')}
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
