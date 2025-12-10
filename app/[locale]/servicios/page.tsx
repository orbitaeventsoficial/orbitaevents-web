// app/servicios/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Music,
  Heart,
  Cake,
  Briefcase,
  Settings,
  Package,
  ArrowRight,
  Star,
  Check,
  PartyPopper
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: [
      'servicios eventos Barcelona',
      'DJ bodas Barcelona',
      'discomóvil Barcelona',
      'fiestas privadas Barcelona',
      'eventos corporativos Barcelona',
      'animación infantil Barcelona',
      'alquiler sonido Barcelona',
      'producción técnica eventos',
    ],
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: '/servicios' },
    openGraph: {
      title: 'Servicios DJ y Eventos Barcelona | Òrbita Events',
      description: 'DJ profesional, discomóvil, fiestas privadas, eventos corporativos, animación infantil y más. Desde 250€. Barcelona y Girona.',
      url: '/servicios',
      images: [{ url: '/img/og-image.jpg', alt: 'Servicios Òrbita Events Barcelona' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Servicios DJ y Eventos Barcelona | Òrbita Events',
      description: 'DJ profesional, discomóvil, fiestas privadas y más. Desde 250€.',
      images: ['/img/og-image.jpg'],
    },
    robots: { index: true, follow: true },
  };
}

const serviciosConfig = [
  { key: 'bodas', icon: Heart, href: '/servicios/bodas', popular: true },
  { key: 'discomovil', icon: Music, href: '/servicios/discomovil', popular: true },
  { key: 'fiestas', icon: Cake, href: '/servicios/fiestas', popular: false },
  { key: 'animacionInfantil', icon: PartyPopper, href: '/servicios/animacion-infantil', popular: false },
  { key: 'empresas', icon: Briefcase, href: '/servicios/empresas', popular: false },
  { key: 'produccion', icon: Settings, href: '/servicios/produccion', popular: false },
  { key: 'alquiler', icon: Package, href: '/servicios/alquiler', popular: false },
] as const;

export default async function ServiciosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  return (
    <div className="min-h-screen bg-bg-main">
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
        ]}
      />

      {/* HERO */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-surface to-bg-main" />

        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-oe-gold/20 border border-oe-gold px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-oe-gold" />
            <span className="text-sm font-medium text-oe-gold">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-display font-black text-white mb-6 leading-[1.1]">
            {t('hero.title')}
            <br />
            <span className="gradient-text breathe">{t('hero.titleHighlight')}</span>
          </h1>

          <p className="text-xl sm:text-2xl text-text-muted max-w-3xl mx-auto mb-8">
            {t('hero.subtitle')}
            <br />
            <span className="text-oe-gold font-bold">
              {t('hero.cta')}
            </span>
          </p>

          {/* CTA PROMINENTE CONFIGURADOR */}
          <div className="mb-12">
            <Link
              href="/configurador"
              className="oe-btn-gold text-xl px-10 py-6 inline-flex items-center gap-3 group"
            >
              <Settings className="w-7 h-7 group-hover:rotate-180 transition-transform duration-500" />
              {t('hero.configureButton')}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            <p className="text-sm text-white/60 mt-3">
              {t('hero.exploreBelow')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-oe-gold" />
              <span className="text-white/80">{t('hero.features.equipment')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-oe-gold" />
              <span className="text-white/80">{t('hero.features.backup')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-oe-gold" />
              <span className="text-white/80">{t('hero.features.guarantee')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* GRID SERVICIOS */}
      <section className="py-20 bg-gradient-to-b from-bg-main to-bg-surface">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviciosConfig.map((servicio) => {
              const Icon = servicio.icon;
              const features = t.raw(`items.${servicio.key}.features`) as string[];
              return (
                <Link
                  key={servicio.href}
                  href={servicio.href}
                  className={`group relative rounded-3xl p-8 transition-all duration-400 bg-bg-surface border border-oe-gold/30 hover:border-oe-gold/50 hover:-translate-y-2 hover:shadow-2xl ${
                    servicio.popular ? 'ring-2 ring-oe-gold/20 ring-offset-2 ring-offset-bg-main' : ''
                  }`}
                >
                  {servicio.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-oe-gold to-[var(--oe-gold-dark)] text-black px-4 py-1.5 rounded-full text-xs font-bold">
                        {t('mostPopular')}
                      </span>
                    </div>
                  )}

                  {/* Icon con gradiente de fondo */}
                  <div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-oe-gold/20 to-oe-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                  >
                    <Icon className="w-8 h-8 text-oe-gold" />
                  </div>

                  <h2 className="text-2xl font-display font-black text-white mb-2 group-hover:text-oe-gold transition-colors">
                    {t(`items.${servicio.key}.name`)}
                  </h2>

                  <p className="text-sm font-medium text-oe-gold mb-3">{t(`items.${servicio.key}.tagline`)}</p>

                  <p className="text-text-muted mb-6 leading-relaxed">{t(`items.${servicio.key}.desc`)}</p>

                  <ul className="space-y-2 mb-6">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-white/80">
                        <Check className="w-4 h-4 text-oe-gold flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 text-oe-gold font-bold group-hover:gap-4 transition-all">
                    {t('viewService')}
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 sm:py-32 bg-bg-surface">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-text-muted mb-10">
            {t('cta.subtitle')}
            <br />
            <span className="text-oe-gold font-bold">{t('cta.responseTime')}</span>
          </p>

          <Link
            href="/contacto"
            className="oe-btn-gold text-xl px-10 py-6 inline-flex items-center gap-3"
          >
            <Music className="w-7 h-7" />
            {t('cta.button')}
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
