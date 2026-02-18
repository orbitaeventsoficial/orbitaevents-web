"use client";

import { useEffect } from "react";
import { Link } from '@/lib/navigation';
import ContactForm from "@/components/forms/ContactFormComplete";
import { Briefcase, Users, Lightbulb, Star, Check, FileText, Shield, TrendingUp, Handshake, Sparkles } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import Image from "next/image";

export default function EmpresasClient() {
  const t = useTranslations('pages.corporate');
  const { track } = useAnalytics();

  useEffect(() => {
    track("View_Empresas");
  }, [track]);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const t = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-bg-main">
      {/* HERO */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-bg-main z-10" />
          <Image
            src="/img/portfolio/eventos-empresa/eventos-empresa-02.avif"
            alt="Eventos corporativos Òrbita Events"
            fill
            priority
            sizes="100vw"
            quality={70}
            className="object-cover animate-slow-zoom"
          />
        </div>

        <div className="relative z-20 mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-5xl sm:text-7xl font-display font-black text-white mb-6 leading-[1.05]">
            {t('heroTitle')}
            <br />
            <span className="gradient-text-gold breathe">{t('heroTitleCity')}</span>
          </h1>
          <p className="text-xl sm:text-2xl text-text-muted max-w-3xl mx-auto mb-10 leading-relaxed">
            {t('heroSubtitle')}
            <br />{t('heroSubtitle2')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/configurador"
              className="btn-primary text-lg px-8 py-5 inline-flex items-center justify-center gap-3"
              onClick={() => track("CTA_Configurador_Empresas")}
            >
              <Sparkles className="w-5 h-5" />
              {t('configureEvent')}
            </Link>
            <Link
              href="/contacto"
              className="btn-secondary text-lg px-8 py-5 inline-flex items-center justify-center gap-3"
              onClick={() => track("CTA_Contact_Empresas")}
            >
              <FileText className="w-5 h-5" />
              {t('requestProposal')}
            </Link>
          </div>
        </div>
      </section>

      {/* TIPOS DE EVENTOS */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-main to-bg-surface">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-h2 text-center text-white mb-12">
            {t('eventsTitle')} <span className="text-oe-gold">{t('eventsTitleHighlight')}</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Briefcase, key: 'companyDinners' },
              { icon: Users, key: 'teamBuilding' },
              { icon: Handshake, key: 'networking' },
              { icon: TrendingUp, key: 'presentations' },
              { icon: Lightbulb, key: 'productLaunch' },
              { icon: Star, key: 'institutional' },
            ].map((s, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-bg-surface border border-border hover:border-oe-gold/50 transition-all text-center"
              >
                <s.icon className="w-12 h-12 text-oe-gold mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">{t(`events.${s.key}.title`)}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{t(`events.${s.key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALOR DIFERENCIAL */}
      <section className="py-20 sm:py-32 bg-bg-surface">
        <div className="mx-auto max-w-5xl px-4">
          <div className="card p-10 rounded-3xl border-2 border-oe-gold/50">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-oe-gold/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-oe-gold" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4 text-center">
              {t('valueTitle')}
            </h2>
            <p className="text-xl text-text-muted mb-8 leading-relaxed text-center">
              {t('valueText')}
            </p>

            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-bg-main rounded-xl">
                <Star className="w-6 h-6 text-oe-gold mx-auto mb-2" />
                <p className="text-white font-bold">{t('stats.experience.value')}</p>
                <p className="text-text-muted text-xs">{t('stats.experience.label')}</p>
              </div>
              <div className="p-4 bg-bg-main rounded-xl">
                <Check className="w-6 h-6 text-oe-gold mx-auto mb-2" />
                <p className="text-white font-bold">{t('stats.location.value')}</p>
                <p className="text-text-muted text-xs">{t('stats.location.label')}</p>
              </div>
              <div className="p-4 bg-bg-main rounded-xl">
                <Briefcase className="w-6 h-6 text-oe-gold mx-auto mb-2" />
                <p className="text-white font-bold">{t('stats.dedication.value')}</p>
                <p className="text-text-muted text-xs">{t('stats.dedication.label')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ INCLUYE */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-surface to-bg-main">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-h2 text-center text-white mb-12">
            {t('includesTitle')} <span className="text-oe-gold">{t('includesTitleHighlight')}</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-bg-surface border border-oe-gold/30">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Check className="w-6 h-6 text-oe-gold" />
                {t('techProduction')}
              </h3>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('techFeatures.sound')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('techFeatures.lighting')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('techFeatures.mics')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('techFeatures.screens')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('techFeatures.setup')}</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-bg-surface border border-oe-gold/30">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-oe-gold" />
                {t('ambientTitle')}
              </h3>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('ambientFeatures.music')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('ambientFeatures.branding')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('ambientFeatures.networking')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('ambientFeatures.coordination')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-oe-gold flex-shrink-0 mt-0.5" />
                  <span>{t('ambientFeatures.protocol')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FORMULARIO */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-main to-bg-surface">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-display font-black text-white mb-6">
            {t('formTitle')}
          </h2>
          <p className="text-lg text-text-muted mb-10">
            {t('formSubtitle')}
          </p>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}

