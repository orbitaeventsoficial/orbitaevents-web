/**
 * Pàgina Halloween - EXPERIÈNCIA COMPLETA DE TERROR
 * =================================================
 *
 * - Hero amb imatge impactant
 * - Galeria de fotos reals (12 fotos)
 * - Packs específics Halloween
 * - Què inclou
 * - Testimoni
 * - CTA final
 */

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PORTFOLIO_IMAGES } from '@/config/portfolio-images';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('halloweenPage');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: 'festa halloween barcelona, decoració halloween, dj halloween, festa terror, efectes especials halloween, fum baix, llums halloween',
    alternates: { canonical: '/tematica-halloween' },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      images: [{ url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg', alt: 'Festa Halloween Barcelona' }],
    },
  };
}

// Obtenir galeria de Halloween del portfolio
const halloweenGallery = PORTFOLIO_IMAGES['fiestas-tematicas-halloween'] || [];

// Packs específics Halloween amb claus de traducció
const halloweenPacks = [
  { key: 'basic', price: '600', hours: '4' },
  { key: 'night', price: '900', hours: '5', popular: true },
  { key: 'zombie', price: '1400', hours: '6' },
];

export default async function HalloweenPage() {
  const t = await getTranslations('halloweenPage');
  const tWhatsapp = await getTranslations('whatsappMessages');

  return (
    <main className="bg-black text-white">
      {/* ========================================
          HERO AMB IMATGE HALLOWEEN
          ======================================== */}
      <section className="relative h-[80vh] overflow-hidden">
        <Image
          src="/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg"
          alt="Festa Halloween Òrbita Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950/30 via-transparent to-orange-950/30" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-4 max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-orange-400 text-sm w-fit mb-4">
            <span className="text-lg">🎃</span> {t('badge')}
          </span>

          <h1 className="text-5xl md:text-7xl font-black">
            <span className="text-white">{t('hero.title1')}</span>
            <br />
            <span className="text-orange-500">{t('hero.title2')}</span>
          </h1>

          <p className="mt-4 text-xl text-white/70 max-w-xl">
            {t('hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contacto?tema=halloween"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-full transition-colors inline-flex items-center gap-2"
            >
              <span>👻</span> {t('cta.reserve')}
            </Link>
            <Link
              href={`https://wa.me/34699121023?text=${encodeURIComponent(tWhatsapp('halloween'))}`}
              className="px-6 py-3 border border-white/30 hover:border-white/60 text-white font-medium rounded-full transition-colors inline-flex items-center gap-2"
            >
              <span>💬</span> {t('cta.whatsapp')}
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          GALERIA IMMERSIVA
          ======================================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('gallery.title')} <span className="text-orange-500">{t('gallery.titleHighlight')}</span>
          </h2>
          <p className="text-white/60 text-center mb-12">
            {t('gallery.subtitle')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {halloweenGallery.slice(0, 12).map((img, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden group ${
                  i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          QUÈ INCLOU
          ======================================== */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-orange-950/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t('includes.title')} <span className="text-orange-500">{t('includes.titleHighlight')}</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-xl font-bold mb-2">{t('includes.dj.title')}</h3>
              <p className="text-white/60">
                {t('includes.dj.description')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
              <div className="text-4xl mb-4">💀</div>
              <h3 className="text-xl font-bold mb-2">{t('includes.decoration.title')}</h3>
              <p className="text-white/60">
                {t('includes.decoration.description')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
              <div className="text-4xl mb-4">🌫️</div>
              <h3 className="text-xl font-bold mb-2">{t('includes.effects.title')}</h3>
              <p className="text-white/60">
                {t('includes.effects.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          PACKS
          ======================================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('packs.title')} <span className="text-orange-500">{t('packs.titleHighlight')}</span>
          </h2>
          <p className="text-white/60 text-center mb-12">
            {t('packs.subtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {halloweenPacks.map((pack) => {
              const packName = t(`packs.${pack.key}.name`);
              const packIncludes = t.raw(`packs.${pack.key}.includes`) as string[];

              return (
                <div
                  key={pack.key}
                  className={`relative p-6 rounded-2xl border ${
                    pack.popular
                      ? 'border-orange-500/50 bg-orange-500/5 shadow-lg shadow-orange-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-black text-xs font-bold rounded-full">
                      {t('packs.mostRequested')}
                    </span>
                  )}

                  <h3 className="text-xl font-bold">{packName}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-orange-400">{pack.price}€</span>
                  </div>
                  <p className="text-sm text-white/50 mt-1">{pack.hours} {t('packs.hours')}</p>

                  <ul className="mt-6 space-y-2">
                    {packIncludes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="text-orange-500 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/contacto?tema=halloween&pack=${encodeURIComponent(packName)}`}
                    className={`mt-6 block w-full text-center py-3 rounded-full font-medium transition-all ${
                      pack.popular
                        ? 'bg-orange-500 hover:bg-orange-400 text-black'
                        : 'border border-white/20 hover:border-white/40 text-white'
                    }`}
                  >
                    {t('cta.requestInfo')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================
          TESTIMONI
          ======================================== */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-orange-950/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🎃</div>
          <blockquote className="text-2xl md:text-3xl font-medium italic text-white/90">
            "{t('testimonial.quote')}"
          </blockquote>
          <p className="mt-6 text-white/50">
            — {t('testimonial.author')}
          </p>
        </div>
      </section>

      {/* ========================================
          CTA FINAL
          ======================================== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('finalCta.title1')}<br />
            <span className="text-orange-500">{t('finalCta.title2')}</span>
          </h2>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              href="/contacto?tema=halloween"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold text-lg rounded-full transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>👻</span> {t('cta.reserve2025')}
            </Link>
            <Link
              href={`https://wa.me/34699121023?text=${encodeURIComponent(tWhatsapp('halloween'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold rounded-full transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>💬</span> {t('cta.whatsapp')}
            </Link>
          </div>

          <p className="mt-8 text-white/50 text-sm">
            {t('finalCta.footer')}
          </p>
        </div>
      </section>
    </main>
  );
}
