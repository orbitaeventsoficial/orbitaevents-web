import { Star, Users, Calendar, Zap, Music, Lightbulb, Sparkles, PartyPopper, ArrowRight, MessageCircle, ClipboardList, Truck, PartyPopperIcon, Shield, Clock, Heart, Award } from 'lucide-react';
import fs from 'node:fs';
import path from 'node:path';
import { Metadata } from 'next';
import { Link } from '@/lib/navigation';
import { getTranslations } from 'next-intl/server';
import TeamMembersGrid from '@/components/about/TeamMembersGrid';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.about' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.about' });

  const stats = [
    { icon: Calendar, key: 'years' },
    { icon: Star, key: 'satisfaction' },
    { icon: PartyPopper, key: 'parties' },
    { icon: Zap, key: 'events' },
  ];

  const services = [
    { icon: Music, key: 'discomovil' },
    { icon: Lightbulb, key: 'lights' },
    { icon: Sparkles, key: 'theming' },
    { icon: PartyPopper, key: 'kids' },
    { icon: Users, key: 'weddings' },
    { icon: Zap, key: 'animations' },
  ];

  // Membres de l'equip amb les seves imatges
  // IMPORTANT: Puja les fotos a /public/img/team/ amb aquests noms:
  // - carles.webp (DJ principal)
  // - tecnic.webp (Tècnic de so i llums)
  // - animador.webp (Animador infantil)
  const teamMembers = [
    { key: 'dj', image: '/img/team/carles.webp' },
    { key: 'tech', image: '/img/team/tecnic.webp' },
    { key: 'animator', image: '/img/team/animador.webp' },
  ];

  const teamMembersData = teamMembers.map((member) => {
    const publicImagePath = path.join(process.cwd(), 'public', member.image.replace(/^\//, '').replace(/\//g, path.sep));
    const image = fs.existsSync(publicImagePath) ? member.image : undefined;

    return {
      ...member,
      image,
      name: t(`team.members.${member.key}.name`),
      role: t(`team.members.${member.key}.role`),
      desc: t(`team.members.${member.key}.desc`),
    };
  });

  return (
    <section className="min-h-screen bg-bg-main py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 oe-vignette pointer-events-none" aria-hidden="true" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] bg-amber-500/[0.04] pointer-events-none" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 relative">

        {/* HERO SEO + EMOCIÓN */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight">
            {t('hero.title')}
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">{t('hero.titleHighlight')}</span>
          </h1>
          <p
            className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t.raw('hero.description') }}
          />
        </div>

        {/* NÚMEROS SEO */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card p-6 text-center rounded-3xl group hover:border-amber-500/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-500">
                <Icon className="w-10 h-10 text-oe-gold mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-4xl font-black text-oe-gold drop-shadow-[0_2px_12px_rgba(245,158,11,0.15)]">{t(`stats.${stat.key}.value`)}</p>
                <p className="text-sm text-white/70">{t(`stats.${stat.key}.label`)}</p>
              </div>
            );
          })}
        </div>

        {/* NUESTRA HISTORIA (SEO + CONFIANZA) */}
        <div className="card p-10 rounded-3xl mb-20 hover:border-white/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] transition-all duration-500">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center tracking-tight">
            {t('history.title')}
          </h2>
          <p
            className="text-lg text-white/80 leading-relaxed text-center max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: t.raw('history.paragraph1') }}
          />
          <p
            className="text-lg text-white/80 leading-relaxed text-center max-w-4xl mx-auto mt-4"
            dangerouslySetInnerHTML={{ __html: t.raw('history.paragraph2') }}
          />
          <p className="text-oe-gold text-xl font-bold text-center mt-6 animate-pulse">
            {t('history.highlight')}
          </p>
        </div>

        {/* QUÉ OFRECEMOS (KEYWORDS SEO) */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 tracking-tight">
            {t('services.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="card p-6 rounded-3xl text-center hover:border-oe-gold/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-500 group">
                  <Icon className="w-12 h-12 text-oe-gold mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-bold text-white mb-2">{t(`services.items.${item.key}.title`)}</h3>
                  <p className="text-sm text-white/70">{t(`services.items.${item.key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROCÉS - TIMELINE 4 PASSOS */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4 tracking-tight">
            {t('process.title')}
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
            {t('process.subtitle')}
          </p>

          <div className="relative">
            {/* Línia connectora (només desktop) */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-oe-gold/30 to-transparent" />

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: MessageCircle, step: 1, key: 'contact' },
                { icon: ClipboardList, step: 2, key: 'plan' },
                { icon: Truck, step: 3, key: 'setup' },
                { icon: PartyPopperIcon, step: 4, key: 'party' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="relative text-center">
                    {/* Número del pas */}
                    <div className="relative z-10 w-14 h-14 mx-auto mb-4 rounded-full bg-oe-gold/10 border-2 border-oe-gold flex items-center justify-center">
                      <Icon className="w-6 h-6 text-oe-gold" />
                    </div>
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-oe-gold text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {item.step}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2">{t(`process.steps.${item.key}.title`)}</h3>
                    <p className="text-sm text-white/60">{t(`process.steps.${item.key}.desc`)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* GARANTIES / PER QUÈ NOSALTRES */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4 tracking-tight">
            {t('guarantees.title')}
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
            {t('guarantees.subtitle')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, key: 'professional' },
              { icon: Clock, key: 'punctual' },
              { icon: Heart, key: 'passion' },
              { icon: Award, key: 'quality' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="card p-6 rounded-2xl text-center hover:border-oe-gold/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-500 group">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-oe-gold/10 flex items-center justify-center group-hover:bg-oe-gold/20 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300">
                    <Icon className="w-6 h-6 text-oe-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t(`guarantees.items.${item.key}.title`)}</h3>
                  <p className="text-sm text-white/60">{t(`guarantees.items.${item.key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* EQUIPO (HUMANIZA) */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 tracking-tight">
            {t('team.title')}
          </h2>
          <TeamMembersGrid members={teamMembersData} />
        </div>

        {/* CTA FINAL SEO */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <Link
            href="/contacto"
            className="btn-primary text-xl px-10 py-6 inline-flex items-center gap-3 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(251,191,36,0.3)]"
          >
            {t('cta.button')}
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-sm text-white/60 mt-4">
            {t('cta.location')}
          </p>
        </div>
      </div>
    </section>
  );
}

