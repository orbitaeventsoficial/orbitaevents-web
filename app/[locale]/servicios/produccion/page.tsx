import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/navigation';


export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const title = t('items.produccion.name');
  const description = t('items.produccion.desc');

  return {
    title,
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
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

export default async function ProduccionPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });

  const features = t.raw('items.produccion.features') as string[];

  return (
    <section className="min-h-screen bg-bg-main py-20">
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
            Contactar
          </Link>
          <Link href="/configurador" className="btn-secondary px-6 py-3">
            Configurar evento
          </Link>
        </div>
      </div>
    </section>
  );
}