/**
 * Pàgina Halloween - EXPERIÈNCIA COMPLETA DE TERROR
 * Estil Tim Burton: gòtic, ombres, boira, siluetes
 */

import { Metadata } from 'next';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { PORTFOLIO_IMAGES } from '@/config/portfolio-images';
import { getTranslations } from 'next-intl/server';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import HalloweenDecorationSection from '@/app/components/ui/HalloweenDecorationSection';
import HalloweenAtmosphere from '@/app/components/ui/HalloweenAtmosphere';

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
      images: [{ url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif', alt: 'Festa Halloween Barcelona' }],
    },
  };
}

const halloweenGallery = PORTFOLIO_IMAGES['fiestas-tematicas-halloween'] || [];

const halloweenPacks = [
  { key: 'basic', price: '600', hours: '4', emoji: '💀' },
  { key: 'night', price: '900', hours: '5', popular: true, emoji: '👻' },
  { key: 'zombie', price: '1400', hours: '6', emoji: '🧟' },
];

export default async function HalloweenPage() {
  const t = await getTranslations('halloweenPage');
  const tWhatsapp = await getTranslations('whatsappMessages');

  return (
    <main className="bg-gradient-to-b from-[#0a0a0a] via-[#0d0805] to-black text-white relative overflow-hidden">
      {/* Atmosfera Tim Burton — ratpenats, partícules, boira */}
      <HalloweenAtmosphere />

      {/* ══════════════════════════════════════
          HERO — Cinematogràfic
          ══════════════════════════════════════ */}
      <section className="relative h-[85vh] overflow-hidden" style={{ touchAction: 'pan-y' }}>
        <Image
          src="/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif"
          alt="Festa Halloween Òrbita Events"
          fill
          sizes="100vw"
          quality={70}
          className="object-cover object-top pointer-events-none"
          priority
        />
        {/* Vignetatge cinematogràfic */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/50 via-transparent to-[#0a0a0a]/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-4 max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 rounded-full text-orange-400 text-sm w-fit mb-4 backdrop-blur-sm">
            <span className="text-lg animate-pulse">🎃</span> {t('badge', { year: new Date().getFullYear() })}
          </span>

          <h1 className="text-5xl md:text-8xl font-black tracking-tight">
            <span className="text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">{t('hero.title1')}</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 drop-shadow-[0_0_40px_rgba(249,115,22,0.3)]">
              {t('hero.title2')}
            </span>
          </h1>

          <p className="mt-4 text-xl text-white/60 max-w-xl leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contacto?tema=halloween"
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-full transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 inline-flex items-center gap-2"
            >
              <span>👻</span> {t('cta.reserve')}
            </Link>
            <Link
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(tWhatsapp('halloween'))}`}
              className="px-8 py-4 border border-white/20 hover:border-orange-500/40 text-white font-medium rounded-full transition-all backdrop-blur-sm hover:bg-white/5 inline-flex items-center gap-2"
            >
              <span>💬</span> {t('cta.whatsapp')}
            </Link>
          </div>
        </div>
      </section>

      {/* Separador gòtic */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

      {/* ══════════════════════════════════════
          DECORACIÓ
          ══════════════════════════════════════ */}
      <HalloweenDecorationSection />

      {/* Separador gòtic */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      {/* ══════════════════════════════════════
          GALERIA IMMERSIVA
          ══════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.04),transparent_60%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('gallery.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{t('gallery.titleHighlight')}</span>
          </h2>
          <p className="text-white/50 text-center mb-12">
            {t('gallery.subtitle')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {halloweenGallery.slice(0, 12).map((img, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden group ring-1 ring-white/5 hover:ring-orange-500/30 transition-all duration-500 ${
                  i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={
                    i === 0
                      ? '(min-width: 768px) 66vw, 100vw'
                      : '(min-width: 768px) 33vw, 50vw'
                  }
                  quality={70}
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Vignetatge fosc als costats */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.3)_100%)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separador gòtic */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

      {/* ══════════════════════════════════════
          QUÈ INCLOU
          ══════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/10 via-transparent to-red-950/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t('includes.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{t('includes.titleHighlight')}</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '🎵', key: 'dj' },
              { emoji: '💀', key: 'decoration' },
              { emoji: '🌫️', key: 'effects' },
            ].map((item) => (
              <div
                key={item.key}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/[0.03] transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.08)] group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.emoji}</div>
                <h3 className="text-xl font-bold mb-2">{t(`includes.${item.key}.title`)}</h3>
                <p className="text-white/50 leading-relaxed">
                  {t(`includes.${item.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separador gòtic */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      {/* ══════════════════════════════════════
          PACKS — Estil gòtic
          ══════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.05),transparent_60%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('packs.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{t('packs.titleHighlight', { year: new Date().getFullYear() })}</span>
          </h2>
          <p className="text-white/50 text-center mb-12">
            {t('packs.subtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {halloweenPacks.map((pack) => {
              const packName = t(`packs.${pack.key}.name`);
              const packIncludes = t.raw(`packs.${pack.key}.includes`) as string[];

              return (
                <div
                  key={pack.key}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 group hover:scale-[1.02] hover:-translate-y-1 ${
                    pack.popular
                      ? 'border-orange-500/40 bg-gradient-to-b from-orange-500/10 to-red-900/10 shadow-[0_0_30px_rgba(249,115,22,0.1)] hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.08)]'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-500/30">
                      {t('packs.mostRequested')}
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{pack.emoji}</span>
                    <h3 className="text-xl font-bold">{packName}</h3>
                  </div>

                  <div className="mt-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">{pack.price}€</span>
                  </div>
                  <p className="text-sm text-white/40 mt-1">{pack.hours} {t('packs.hours')}</p>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

                  <ul className="space-y-2">
                    {packIncludes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="text-orange-500 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/contacto?tema=halloween&pack=${encodeURIComponent(packName)}`}
                    className={`mt-6 block w-full text-center py-3 rounded-full font-bold transition-all ${
                      pack.popular
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30'
                        : 'border border-white/15 text-white hover:border-orange-500/40 hover:bg-orange-500/5'
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

      {/* Separador gòtic */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

      {/* ══════════════════════════════════════
          TESTIMONI — Gòtic
          ══════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.04),transparent_50%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-6">🎃</div>
          <blockquote className="text-2xl md:text-3xl font-medium italic text-white/80 leading-relaxed">
            &ldquo;{t('testimonial.quote')}&rdquo;
          </blockquote>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent mx-auto my-6" />
          <p className="text-white/40">
            — {t('testimonial.author')}
          </p>
        </div>
      </section>

      {/* Separador gòtic */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      {/* ══════════════════════════════════════
          CTA FINAL — Dramàtic
          ══════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-950/15 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            {t('finalCta.title1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600">{t('finalCta.title2')}</span>
          </h2>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              href="/contacto?tema=halloween"
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-lg rounded-full transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 inline-flex items-center justify-center gap-2"
            >
              <span>👻</span> {t('cta.reserve2025', { year: new Date().getFullYear() })}
            </Link>
            <Link
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(tWhatsapp('halloween'))}`}
              target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 border border-white/20 hover:border-orange-500/40 text-white font-semibold rounded-full transition-all backdrop-blur-sm hover:bg-white/5 inline-flex items-center justify-center gap-2"
            >
              <span>💬</span> {t('cta.whatsapp')}
            </Link>
          </div>

          <p className="mt-8 text-white/40 text-sm">
            {t('finalCta.footer')}
          </p>
        </div>
      </section>
    </main>
  );
}
