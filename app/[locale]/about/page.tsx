import { Star, Users, Calendar, Zap, Music, Lightbulb, Sparkles, PartyPopper, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import { Link } from '@/lib/navigation';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.about' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
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

  const teamMembers = ['dj', 'tech', 'animator'];

  return (
    <section className="min-h-screen bg-bg-main py-20">
      <div className="mx-auto max-w-6xl px-4">

        {/* HERO SEO + EMOCIÓN */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
            {t('hero.title')}
            <br />
            <span className="gradient-text">{t('hero.titleHighlight')}</span>
          </h1>
          <p
            className="text-xl text-white/70 max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: t('hero.description') }}
          />
        </div>

        {/* NÚMEROS SEO */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="oe-card p-6 text-center rounded-3xl">
                <Icon className="w-10 h-10 text-oe-gold mx-auto mb-3" />
                <p className="text-4xl font-black text-oe-gold">{t(`stats.${stat.key}.value`)}</p>
                <p className="text-sm text-white/70">{t(`stats.${stat.key}.label`)}</p>
              </div>
            );
          })}
        </div>

        {/* NUESTRA HISTORIA (SEO + CONFIANZA) */}
        <div className="oe-card p-10 rounded-3xl mb-20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {t('history.title')}
          </h2>
          <p
            className="text-lg text-white/80 leading-relaxed text-center max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: t('history.paragraph1') }}
          />
          <p
            className="text-lg text-white/80 leading-relaxed text-center max-w-4xl mx-auto mt-4"
            dangerouslySetInnerHTML={{ __html: t('history.paragraph2') }}
          />
          <p className="text-oe-gold text-xl font-bold text-center mt-6 animate-pulse">
            {t('history.highlight')}
          </p>
        </div>

        {/* QUÉ OFRECEMOS (KEYWORDS SEO) */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            {t('services.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="oexm-card p-6 rounded-3xl text-center hover:border-oe-gold/50 transition-all">
                  <Icon className="w-12 h-12 text-oe-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{t(`services.items.${item.key}.title`)}</h3>
                  <p className="text-sm text-white/70">{t(`services.items.${item.key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* EQUIPO (HUMANIZA) */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            {t('team.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, i) => (
              <div key={i} className="oe-card p-6 rounded-3xl text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-oe-gold to-oe-gold" />
                <h3 className="text-xl font-bold text-white">{t(`team.members.${member}.name`)}</h3>
                <p className="text-oe-gold text-sm mb-2">{t(`team.members.${member}.role`)}</p>
                <p className="text-sm text-white/70">{t(`team.members.${member}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA FINAL SEO */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <Link
            href="/contacto"
            className="oe-btn-gold text-xl px-10 py-6 inline-flex items-center gap-3"
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

