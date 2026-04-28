// app/[locale]/experiencias/page.tsx
// ORBITA EVENTS - Pagina d'Experiencies Tematiques
// La galeria mes BRUTAL de tematiques disponibles!

import type { Metadata } from 'next';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { PUBLIC_EXPERIENCES_PAGE_ITEMS, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('experiences');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}


export default async function ExperienciasPage() {
  const t = await getTranslations('experiences');
  const tWhatsapp = await getTranslations('whatsappMessages');

  return (
    <main className="relative">
      {/* Background consistent */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.1),transparent_50%)] -z-10" />

      {/* =============================================================== */}
      {/* HERO SECTION                                                    */}
      {/* =============================================================== */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-purple-400 text-sm font-medium mb-6 border border-purple-500/30">
              <span className="text-xl">✨</span>
              {t('badge')}
            </span>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              {t('title.line1')}{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                {t('title.highlight')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-8">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400">6+</div>
                <div className="text-white/60 text-sm">{t('stats.themes')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400">100%</div>
                <div className="text-white/60 text-sm">{t('stats.customizable')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-400">50+</div>
                <div className="text-white/60 text-sm">{t('stats.events')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================== */}
      {/* PUBLIC_EXPERIENCES_PAGE_ITEMS GRID                                                */}
      {/* =============================================================== */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('grid.title')}
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              {t('grid.subtitle')}
            </p>
          </div>

          {/* Grid d'experiencies */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PUBLIC_EXPERIENCES_PAGE_ITEMS.map((exp) => {
              const isComingSoon = 'comingSoon' in exp && Boolean(exp.comingSoon);
              return (
                <Link
                key={exp.id}
                href={exp.href}
                className={`group relative rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 ${
                  isComingSoon ? 'opacity-70' : ''
                }`}
              >
                {/* Background image */}
                <div className="relative h-80 md:h-96">
                  <Image
                    src={exp.image}
                    alt={t(exp.titleKey)}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={70}
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${exp.bgGradient}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                {/* Badge */}
                {exp.badgeKey && (
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 ${exp.badgeColor} text-white text-xs font-bold rounded-full shadow-lg`}>
                      {isComingSoon ? t('comingSoon') : t(exp.badgeKey)}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  {/* Icon */}
                  <span className="text-5xl mb-4 block group-hover:scale-125 transition-transform duration-300">
                    {exp.icon}
                  </span>

                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {t(exp.titleKey)}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-white/80 font-medium mb-3">
                    {t(exp.subtitleKey)}
                  </p>

                  {/* Description */}
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {t(exp.descriptionKey)}
                  </p>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-2 text-amber-400 font-semibold group-hover:gap-3 transition-all">
                    {isComingSoon ? t('notifyMe') : t('viewExperience')}
                    <ArrowRightIcon className="w-4 h-4" />
                  </span>
                </div>

                {/* Hover glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-t ${exp.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =============================================================== */}
      {/* CTA SECTION                                                     */}
      {/* =============================================================== */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-6">
              <span>🎨</span>
              {t('cta.badge') || 'Personalitza'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-white/60 text-lg mb-8">
              {t('cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={WHATSAPP_URL_WITH_MESSAGE(tWhatsapp('experiencias'))}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)]"
              >
                <WhatsAppIcon className="w-5 h-5" />
                WhatsApp
              </a>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all hover:scale-105"
              >
                {t('cta.custom')}
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-white/60 text-sm mt-8">
              {t('cta.note')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
