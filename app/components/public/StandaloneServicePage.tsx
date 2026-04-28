import { Link } from '@/lib/navigation';
import { getTranslations } from 'next-intl/server';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import type { StandaloneServiceSeoConfig } from '@/lib/standaloneServiceSeo';

export type StandaloneServicePageFaqItem = {
  q: string;
  a: string;
};

type StandaloneServicePageProps = {
  slug: string;
  itemKey: string;
  locale: string;
  seo: StandaloneServiceSeoConfig;
  faqItems: StandaloneServicePageFaqItem[];
};

export default async function StandaloneServicePage({
  slug,
  itemKey,
  locale,
  seo,
  faqItems,
}: StandaloneServicePageProps) {
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const features = t.raw(`items.${itemKey}.features`) as string[];

  return (
    <section className="min-h-screen bg-bg-main py-20 relative">
      <ServiceJsonLD
        name={seo.jsonLd.name}
        slugPath={`/servicios/${slug}`}
        description={seo.jsonLd.description}
        serviceType={seo.jsonLd.serviceType}
        areaServed={seo.jsonLd.areaServed}
        priceFrom={seo.jsonLd.priceFrom}
        priceCurrency={seo.jsonLd.priceCurrency}
      />
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
          {t(`items.${itemKey}.name`)}
        </h1>
        <p className="text-xl text-white/70 mb-6">
          {t(`items.${itemKey}.tagline`)}
        </p>
        <p className="text-base text-white/80 mb-8">
          {t(`items.${itemKey}.desc`)}
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
