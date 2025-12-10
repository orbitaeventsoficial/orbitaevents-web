// app/[locale]/page.tsx
// ÒRBITA EVENTS - LA PÁGINA QUE HACE LLORAR A LA COMPETENCIA
// Filosofía Manolo: Cada píxel vende. Sin relleno.
// VERSIÓ MULTIIDIOMA - Usa getTranslations per a català i espanyol
// VERSIÓ BRUTAL - Components cinematogràfics que converteixen

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { 
  HeroCinematicBrutal, 
  TestimonialsBrutal, 
  CTASectionBrutal, 
  WhyUsBrutal 
} from '../components/home';

export const revalidate = 3600; // 1 hora - més estable per producció

// METADATA DINÀMICA PER IDIOMA
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  
  const isSpanish = locale === 'es';
  
  return {
    title: isSpanish 
      ? 'DJ Bodas y Eventos Barcelona | Discomóvil + Tematización | Òrbita Events'
      : 'DJ Casaments i Events Barcelona | Discomòbil + Tematització | Òrbita Events',
    description: isSpanish
      ? 'DJ profesional para bodas, fiestas y eventos en Barcelona y Girona. Discomóvil con sonido 4000W, luces LED, efectos especiales y tematización única. Presupuesto en 2h.'
      : 'DJ professional per a casaments, festes i events a Barcelona i Girona. Discomòbil amb so 4000W, llums LED, efectes especials i tematització única. Pressupost en 2h.',
    keywords: isSpanish
      ? ['dj bodas barcelona', 'discomóvil barcelona', 'dj eventos', 'fiestas tematizadas', 'halloween barcelona', 'bodas harry potter']
      : ['dj casaments barcelona', 'discomòbil barcelona', 'dj events', 'festes temàtiques', 'halloween barcelona', 'casaments harry potter'],
    openGraph: {
      title: isSpanish 
        ? 'DJ Bodas y Eventos Barcelona | Desde 400€ | Òrbita Events'
        : 'DJ Casaments i Events Barcelona | Des de 400€ | Òrbita Events',
      description: isSpanish
        ? 'DJ + Sonido + Luces + Efectos + Tematización. Barcelona y Girona. Presupuesto gratis.'
        : 'DJ + So + Llums + Efectes + Tematització. Barcelona i Girona. Pressupost gratis.',
      images: [{ url: '/og-home.jpg', width: 1200, height: 630, alt: 'Òrbita Events - DJ Bodas Barcelona' }],
    },
  };
}

// ============================================
// SERVICIOS - Los 3 pilares
// ============================================
interface ServiceItem {
  id: string;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  priceKey: string;
  image: string;
  href: string;
  popular: boolean;
}

const SERVICES: ServiceItem[] = [
  {
    id: 'bodas',
    emoji: '💍',
    titleKey: 'bodas.title',
    subtitleKey: 'bodas.subtitle',
    descriptionKey: 'bodas.description',
    priceKey: 'from',
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
    popular: false,
  },
  {
    id: 'fiestas',
    emoji: '🎉',
    titleKey: 'fiestas.title',
    subtitleKey: 'fiestas.subtitle',
    descriptionKey: 'fiestas.description',
    priceKey: 'from',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
    popular: true,
  },
  {
    id: 'empresas',
    emoji: '💼',
    titleKey: 'empresas.title',
    subtitleKey: 'empresas.subtitle',
    descriptionKey: 'empresas.description',
    priceKey: 'from',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
    popular: false,
  },
];

const PRICES = {
  bodas: '650€',
  fiestas: '400€',
  empresas: '500€',
};

async function ServicesSection() {
  const t = await getTranslations('services');

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-white/60">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SERVICES.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="group block h-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={service.image}
                  alt={t(service.titleKey)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-4 left-4 text-4xl">{service.emoji}</span>
                {service.popular && (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                    {t('popular')}
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {t(service.titleKey)}
                </h3>
                <p className="text-amber-400/80 text-sm mb-3">{t(service.subtitleKey)}</p>
                <p className="text-white/60 text-sm mb-4">{t(service.descriptionKey)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">{t('from')} {PRICES[service.id as keyof typeof PRICES]}</span>
                  <span className="text-white/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                    {t('viewMore')} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// TEMATIZACIÓN - El diferenciador BRUTAL
// ============================================
interface ThemeItem {
  id: string;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  image: string;
  href: string;
  gradient: string;
  video: string | null;
}

const THEMES: ThemeItem[] = [
  {
    id: 'mon-magic',
    emoji: '🪄',
    titleKey: 'monMagic.title',
    subtitleKey: 'monMagic.subtitle',
    descriptionKey: 'monMagic.description',
    image: '/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg',
    href: '/tematica-mon-magic',
    gradient: 'from-purple-600 to-blue-600',
    video: null,
  },
  {
    id: 'halloween',
    emoji: '🎃',
    titleKey: 'halloween.title',
    subtitleKey: 'halloween.subtitle',
    descriptionKey: 'halloween.description',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    href: '/tematica-halloween',
    gradient: 'from-orange-600 to-red-700',
    video: '/video/promohalloween.mp4',
  },
];

async function ThemesSection() {
  const t = await getTranslations('themes');

  return (
    <section className="py-20 bg-gradient-to-b from-black via-purple-950/10 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium mb-4 border border-purple-500/30">
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {THEMES.map((theme) => (
            <Link
              key={theme.id}
              href={theme.href}
              className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-500"
            >
              {/* Background Image/Video */}
              <div className="relative h-80 md:h-96">
                {theme.video ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    poster={theme.image}
                  >
                    <source src={theme.video} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={theme.image}
                    alt={t(theme.titleKey)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} opacity-40`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="text-5xl mb-4 block">{theme.emoji}</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {t(theme.titleKey)}
                </h3>
                <p className="text-white/80 font-medium mb-2">{t(theme.subtitleKey)}</p>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{t(theme.descriptionKey)}</p>
                <span className="inline-flex items-center gap-2 text-amber-400 font-medium group-hover:gap-3 transition-all">
                  {t('viewExperience')}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>

              {/* Hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
            </Link>
          ))}
        </div>

        <p className="text-center mt-8 text-white/40 text-sm">
          {t('note')}
        </p>
      </div>
    </section>
  );
}

// ============================================
// POR QUÉ NOSOTROS - El diferenciador real
// ============================================
async function WhyUsSection() {
  const t = await getTranslations('whyUs');

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-colors">
            <span className="text-4xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold text-white mb-3">{t('experience.title')}</h3>
            <p className="text-white/60 leading-relaxed">
              {t('experience.description')}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-colors">
            <span className="text-4xl mb-4 block">🧠</span>
            <h3 className="text-xl font-bold text-white mb-3">{t('timing.title')}</h3>
            <p className="text-white/60 leading-relaxed">
              {t('timing.description')}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-colors">
            <span className="text-4xl mb-4 block">🔧</span>
            <h3 className="text-xl font-bold text-white mb-3">{t('equipment.title')}</h3>
            <p className="text-white/60 leading-relaxed">
              {t('equipment.description')}
            </p>
          </div>
        </div>

        {/* Quote */}
        <div className="text-center max-w-3xl mx-auto mt-16">
          <div className="relative">
            <span className="absolute -top-6 left-0 text-6xl text-amber-500/20">&quot;</span>
            <blockquote className="text-xl md:text-2xl text-white/90 italic px-8">
              {t('quote')}
            </blockquote>
            <span className="absolute -bottom-6 right-0 text-6xl text-amber-500/20">&quot;</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIO REAL - Prueba social
// ============================================
async function TestimonialSection() {
  const t = await getTranslations('testimonials');

  return (
    <section className="py-20 bg-gradient-to-b from-black to-purple-950/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 backdrop-blur rounded-3xl overflow-hidden border border-white/10">
            <div className="relative h-56 md:h-64">
              <Image
                src="/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg"
                alt={t('event')}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            </div>
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-lg md:text-xl text-white/90 italic mb-6 leading-relaxed">
                &quot;{t('quote')}&quot;
              </blockquote>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-lg">{t('author')}</p>
                  <p className="text-white/50 text-sm">{t('event')} • {t('date')}</p>
                </div>
                <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                  ✓ {t('verified')}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-white/50 mb-4">{t('cta')}</p>
            <Link
              href="/opiniones/nueva"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 text-amber-400 rounded-full hover:bg-amber-500/30 transition border border-amber-500/30"
            >
              {t('ctaButton')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA FINAL - El cierre de venta
// ============================================
async function CTASection() {
  const t = await getTranslations('ctaSection');

  return (
    <section className="py-20 bg-gradient-to-b from-purple-950/20 to-black">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-white/60 mb-8">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="https://wa.me/34699121023"
              target="_blank"
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 hover:scale-105 transition-all shadow-lg shadow-green-500/25"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('whatsapp')}
            </Link>
            <Link
              href="tel:+34699121023"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all"
            >
              {t('call')}
            </Link>
            <Link
              href="/contacto"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all"
            >
              {t('form')}
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-white/50 text-sm">
            <span>{t('response')}</span>
            <span>•</span>
            <span>{t('phone')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PAGE PRINCIPAL - VERSIÓ BRUTAL
// ============================================
export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      <HeroCinematicBrutal />
      <ServicesSection />
      <ThemesSection />
      <WhyUsBrutal />
      <TestimonialsBrutal />
      <CTASectionBrutal />
    </main>
  );
}
