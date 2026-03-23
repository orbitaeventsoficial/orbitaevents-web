import { Metadata } from 'next';
import { PUBLIC_HALLOWEEN_WEDDING_FAQ_KEYS, PUBLIC_HALLOWEEN_WEDDING_FEATURE_KEYS } from '@/lib/constants';
import { Link } from '@/lib/navigation';
import { SITE_CONFIG } from '@/app/config/site-config';
import { Ghost, Skull, Moon, Sparkles, Star, CheckCircle, Calendar, MessageCircle, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Boda Halloween Barcelona | Especialistes en Bodes Temàtiques | Òrbita Events',
  description: 'Especialistas en bodas Halloween en Barcelona y Catalunya. Decoración, efectos especiales y DJ especializado. Presupuesto sin compromiso.',
  keywords: ['boda halloween', 'boda halloween barcelona', 'boda tematica halloween', 'bodas tematicas barcelona', 'dj boda halloween'],
  openGraph: {
    title: 'Boda Halloween Barcelona | Especialistas en Bodas Temáticas',
    description: 'Tematización completa, DJ especializado, efectos especiales. Haz tu boda inolvidable.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Òrbita Events',
  },
  alternates: {
    canonical: '/boda-halloween',
  },
};


export default async function BodaHalloweenPage() {
  const t = await getTranslations('bodaHalloween');
  const tWhatsapp = await getTranslations('whatsappMessages');
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(tWhatsapp('bodas'))}`;

  const FEATURE_ICONS = {
    theming: Ghost,
    effects: Sparkles,
    dj: Moon,
    experience: Skull,
  } as const;


  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Boda Halloween Barcelona',
            description: 'Servicio especializado en bodas temáticas Halloween en Barcelona y Catalunya.',
            provider: {
              '@type': 'LocalBusiness',
              name: SITE_CONFIG.business.name,
              telephone: SITE_CONFIG.business.phone,
              email: SITE_CONFIG.business.email,
              address: {
                '@type': 'PostalAddress',
                addressLocality: SITE_CONFIG.business.address.city,
                addressRegion: SITE_CONFIG.business.address.region,
                addressCountry: 'ES',
              },
            },
            areaServed: ['Barcelona', 'Girona', 'Costa Brava', 'Maresme'],
            serviceType: 'Wedding DJ and Event Production',
          }),
        }}
      />

      <main className="min-h-screen bg-bg-main">
        {/* HERO */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background con gradiente Halloween */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-bg-main to-purple-950/30" />

          {/* Elementos decorativos */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-orange-600/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full mb-8">
                <Ghost className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-medium">{t('badge')}</span>
              </div>

              {/* Título */}
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                {t('heroTitle1')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
                  {t('heroTitle2')}
                </span>
                <br />
                {t('heroTitle3')}
              </h1>

              {/* Subtítulo */}
              <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto">
                {t('heroSubtitle')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/30"
                >
                  <Calendar className="w-5 h-5" />
                  {t('ctaBudget')}
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t('ctaWhatsapp')}
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-12 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>+{SITE_CONFIG.stats.eventsCompleted} {t('trustEvents')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{SITE_CONFIG.stats.recommendRate}% {t('trustRecommend')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>{t('trustResponse')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-24 bg-bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                {t('featuresTitle')}
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                {t('featuresSubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {PUBLIC_HALLOWEEN_WEDDING_FEATURE_KEYS.map((featureKey) => {
                const Icon = FEATURE_ICONS[featureKey];
                return (
                  <div
                    key={featureKey}
                    className="bg-bg-card border border-border rounded-2xl p-8 hover:border-orange-500/50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{t(`features.${featureKey}.title`)}</h3>
                    <p className="text-white/60">{t(`features.${featureKey}.description`)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                {t('faqTitle')}
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {PUBLIC_HALLOWEEN_WEDDING_FAQ_KEYS.map((faqKey) => (
                <div
                  key={faqKey}
                  className="bg-bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{t(`faq.${faqKey}`)}</h3>
                  <p className="text-white/60">{t(`faq.a${faqKey.slice(1)}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-orange-950/50 to-purple-950/50 border border-orange-500/30 rounded-3xl p-12">
              <Ghost className="w-16 h-16 text-orange-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">
                {t('finalCtaTitle')}
              </h2>
              <p className="text-xl text-white/70 mb-8">
                {t('finalCtaSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/30"
                >
                  {t('finalCtaBudget')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={`tel:${SITE_CONFIG.business.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all"
                >
                  {t('finalCtaCall')} {SITE_CONFIG.business.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
