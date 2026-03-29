/**
 * Pàgina Halloween - EXPERIÈNCIA IMMERSIVA DE TERROR
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
    keywords: 'halloween immersiu barcelona, passatge encantat, decoració halloween premium, dj halloween, efectes especials halloween, fum baix, festa temàtica halloween',
    alternates: { canonical: '/tematica-halloween' },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      images: [{ url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif', alt: 'Halloween immersiu Barcelona' }],
    },
  };
}

const halloweenGallery = PORTFOLIO_IMAGES['fiestas-tematicas-halloween'] || [];

const halloweenPacks = [
  { key: 'basic', price: '600', hours: '4', emoji: '🕯️' },
  { key: 'night', price: '900', hours: '5', popular: true, emoji: '👻' },
  { key: 'zombie', price: '1400', hours: '6', emoji: '💀' },
];

export default async function HalloweenPage() {
  const t = await getTranslations('halloweenPage');
  const tWhatsapp = await getTranslations('whatsappMessages');

  return (
    <main className="relative overflow-hidden bg-[linear-gradient(180deg,#090909_0%,#120b08_26%,#12090d_58%,#060606_100%)] text-white">
      <HalloweenAtmosphere />

      <section className="relative min-h-[92svh] overflow-hidden" style={{ touchAction: 'pan-y' }}>
        <Image
          src="/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif"
          alt="Halloween immersiu Òrbita Events"
          fill
          sizes="100vw"
          quality={74}
          className="pointer-events-none object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-black/68 to-black/24" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090909]/65 via-transparent to-[#090909]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_46%,rgba(0,0,0,0.62)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#080808] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:pb-16">
          <div className="max-w-2xl rounded-[32px] border border-white/10 bg-black/28 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-7">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/12 px-4 py-1.5 text-sm text-orange-300 backdrop-blur-sm">
              <span className="text-base">🎃</span>
              {t('badge', { year: new Date().getFullYear() })}
            </span>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-white/55 sm:text-sm">
              Passatge encantat, boira, llum i escena real
            </p>

            <h1 className="text-5xl font-black leading-[0.93] tracking-tight sm:text-7xl md:text-8xl">
              <span className="block text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">{t('hero.title1')}</span>
              <span className="block bg-gradient-to-r from-orange-300 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(249,115,22,0.22)]">
                {t('hero.title2')}
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-white/72 sm:text-xl">
              {t('hero.subtitle')}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/62 sm:text-sm">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Decoració real</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">DJ temàtic</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Fum i llum sincronitzats</span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contacto?tema=halloween"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/35"
              >
                <span>👻</span> {t('cta.reserve')}
              </Link>
              <Link
                href={
                  'https://wa.me/' +
                  WHATSAPP_NUMBER +
                  '?text=' +
                  encodeURIComponent(tWhatsapp('halloween'))
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-white/[0.02] px-7 py-4 text-base font-medium text-white transition-all hover:border-orange-500/35 hover:bg-white/[0.05]"
              >
                <span>💬</span> {t('cta.whatsapp')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/6 bg-white/[0.02] px-4 py-5 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
          {[
            { title: t('gallery.title'), copy: t('gallery.subtitle') },
            { title: t('includes.decoration.title'), copy: t('includes.intro') },
            { title: t('packs.night.name'), copy: t('packs.subtitle') },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/8 bg-black/18 px-4 py-4">
              <p className="text-sm font-semibold text-orange-300">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-white/62">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <HalloweenDecorationSection />
      <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <section className="relative px-4 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.05),transparent_62%)]" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">Escenes reals</p>
            <h2 className="text-3xl font-bold md:text-4xl">
              {t('gallery.title')} <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{t('gallery.titleHighlight')}</span>
            </h2>
            <p className="mt-4 text-white/52">{t('gallery.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {halloweenGallery.slice(0, 12).map((img, i) => (
              <div
                key={i}
                className={
                  'group relative overflow-hidden rounded-2xl ring-1 ring-white/6 transition-all duration-500 hover:ring-orange-500/30 ' +
                  (i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-square')
                }
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 50vw'}
                  quality={72}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.3)_100%)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

      <section className="relative px-4 py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-orange-950/10 via-transparent to-red-950/10" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">Com construïm l'escena</p>
            <h2 className="text-3xl font-bold md:text-4xl">
              {t('includes.title')} <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{t('includes.titleHighlight')}</span>
            </h2>
            <p className="mt-4 text-white/56">{t('includes.intro')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              { emoji: '🎵', key: 'dj' },
              { emoji: '🕯️', key: 'decoration' },
              { emoji: '🌫️', key: 'effects' },
            ].map((item) => (
              <div
                key={item.key}
                className="group rounded-[26px] border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500/[0.03] hover:shadow-[0_0_20px_rgba(249,115,22,0.08)]"
              >
                <div className="mb-4 text-4xl transition-transform group-hover:scale-110">{item.emoji}</div>
                <h3 className="mb-2 text-xl font-bold">{t('includes.' + item.key + '.title')}</h3>
                <p className="leading-relaxed text-white/56">{t('includes.' + item.key + '.description')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <section className="relative px-4 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.06),transparent_62%)]" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">Formats</p>
            <h2 className="text-3xl font-bold md:text-4xl">
              {t('packs.title')} <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{t('packs.titleHighlight', { year: new Date().getFullYear() })}</span>
            </h2>
            <p className="mt-4 text-white/56">{t('packs.subtitle')}</p>
          </div>

          <div className="mb-8 rounded-[28px] border border-orange-500/15 bg-gradient-to-r from-orange-500/8 via-white/[0.02] to-red-500/8 px-5 py-4 text-center text-sm text-white/68">
            {t('packs.includesDecoration')}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {halloweenPacks.map((pack) => {
              const packName = t('packs.' + pack.key + '.name');
              const packIncludes = t.raw('packs.' + pack.key + '.includes') as string[];

              return (
                <div
                  key={pack.key}
                  className={
                    'group relative rounded-[28px] border p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ' +
                    (pack.popular
                      ? 'border-orange-500/40 bg-gradient-to-b from-orange-500/10 to-red-900/10 shadow-[0_0_30px_rgba(249,115,22,0.1)] hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.08)]')
                  }
                >
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-orange-500/30">
                      {t('packs.mostRequested')}
                    </span>
                  )}

                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-3xl">{pack.emoji}</span>
                    <h3 className="text-xl font-bold">{packName}</h3>
                  </div>

                  <div className="mt-2">
                    <span className="bg-gradient-to-r from-orange-300 to-red-400 bg-clip-text text-4xl font-black text-transparent">{pack.price}€</span>
                  </div>
                  <p className="mt-1 text-sm text-white/40">{pack.hours} {t('packs.hours')}</p>

                  <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <ul className="space-y-2">
                    {packIncludes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/62">
                        <span className="mt-0.5 text-orange-400">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={'/contacto?tema=halloween&pack=' + encodeURIComponent(packName)}
                    className={
                      'mt-6 block w-full rounded-full py-3 text-center font-bold transition-all ' +
                      (pack.popular
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30'
                        : 'border border-white/15 text-white hover:border-orange-500/40 hover:bg-orange-500/5')
                    }
                  >
                    {t('cta.requestInfo')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

      <section className="relative px-4 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.04),transparent_50%)]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 text-6xl">🎃</div>
          <blockquote className="text-2xl font-medium italic leading-relaxed text-white/80 md:text-3xl">
            &ldquo;{t('testimonial.quote')}&rdquo;
          </blockquote>
          <div className="mx-auto my-6 h-px w-24 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
          <p className="text-white/40">— {t('testimonial.author')}</p>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <section className="relative px-4 py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orange-950/15 to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">Tancament</p>
          <h2 className="mb-6 text-3xl font-black md:text-5xl">
            {t('finalCta.title1')}<br />
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent">{t('finalCta.title2')}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-white/56">{t('finalCta.subtitle')}</p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/contacto?tema=halloween"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/40"
            >
              <span>👻</span> {t('cta.reserve2025', { year: new Date().getFullYear() })}
            </Link>
            <Link
              href={
                'https://wa.me/' +
                WHATSAPP_NUMBER +
                '?text=' +
                encodeURIComponent(tWhatsapp('halloween'))
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 font-semibold text-white transition-all hover:border-orange-500/40 hover:bg-white/5"
            >
              <span>💬</span> {t('cta.whatsapp')}
            </Link>
          </div>

          <p className="mt-8 text-sm text-white/40">{t('finalCta.footer')}</p>
        </div>
      </section>
    </main>
  );
}
