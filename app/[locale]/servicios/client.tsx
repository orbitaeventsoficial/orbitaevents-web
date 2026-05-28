'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Link, useRouter } from '@/lib/navigation';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { useState, useRef, useCallback } from 'react';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIOS CLIENT v2.0 - ESTIL ELEGANT
// ═══════════════════════════════════════════════════════════════════════════

interface Servicio {
  key: string;
  href: string;
  popular: boolean;
  icon: string;
  emoji: string;
  novelty?: boolean;
  name: string;
  tagline: string;
  desc: string;
  features: string[];
}

interface ServiciosClientProps {
  heroImage: string;
  servicios: Servicio[];
  texts: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    cta: string;
    configureButton: string;
    exploreBelow: string;
    equipment: string;
    backup: string;
    guarantee: string;
    mostPopular: string;
    viewService: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaResponseTime: string;
    ctaButton: string;
    ctaWhatsappMessage: string;
    ctaWhatsappButton: string;
  };
}

const Icons = {
  Arrow: () => <ArrowRightIcon width={20} height={20} />,
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Settings: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  WhatsApp: () => (
    <WhatsAppIcon width={24} height={24} />
  ),
};

export default function ServiciosClient({ servicios, texts, heroImage }: ServiciosClientProps) {
  const router = useRouter();
  const [focusedCard, setFocusedCard] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleCardClick = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (focusedCard === href) {
      router.push(href);
    } else {
      setFocusedCard(href);
      const el = cardRefs.current[href];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [focusedCard, router]);

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[50svh] items-center overflow-hidden sm:min-h-[60vh]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-bg-main z-10" />
          <Image
            src={heroImage}
            alt="Serveis d'events Òrbita Events"
            fill
            priority
            sizes="100vw"
            quality={70}
            className="object-cover"
          />
        </div>

        <div className="relative z-20 mx-auto max-w-5xl px-4 py-12 text-center sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-400 backdrop-blur-sm sm:text-sm">
              <span>⭐</span>
              {texts.badge}
            </span>

            <h1 className="mb-4 text-4xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              {texts.title}
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {texts.titleHighlight}
              </span>
            </h1>

            <p className="mx-auto mb-3 max-w-2xl text-base leading-7 text-white/78 sm:text-xl">
              {texts.subtitle}
            </p>
            <p className="mb-6 text-base font-medium text-amber-400 sm:text-lg">
              {texts.cta}
            </p>

            <div className="mb-8">
              <Link
                href="/configurador"
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-base font-bold text-black transition-all hover:from-amber-400 hover:to-orange-400 hover:shadow-[0_8px_30px_rgba(251,191,36,0.3)] sm:px-8 sm:py-5 sm:text-lg md:hover:scale-105"
              >
                <Icons.Settings />
                {texts.configureButton}
                <Icons.Arrow />
              </Link>
              <p className="text-sm text-white/50 mt-4">
                {texts.exploreBelow}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm">
              {[texts.equipment, texts.backup, texts.guarantee].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-white/70">
                  <span className="text-amber-400"><Icons.Check /></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* GRID SERVICIOS */}
      <section className="relative px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {servicios.map((servicio, index) => (
              <motion.div
                key={servicio.href}
                ref={(el) => { cardRefs.current[servicio.href] = el; }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  onClick={(e) => handleCardClick(servicio.href, e)}
                  className={`
                    group relative block h-full cursor-pointer rounded-3xl p-6 transition-all duration-300 sm:p-8
                    bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm
                    border hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10
                    ${focusedCard === servicio.href
                      ? 'border-amber-500/50 -translate-y-2 shadow-2xl shadow-amber-500/15 ring-1 ring-amber-500/20'
                      : servicio.popular
                        ? 'border-amber-500/30 hover:border-amber-500/50'
                        : 'border-white/10 hover:border-amber-500/30'
                    }
                  `}
                >
                  {servicio.popular && !servicio.novelty && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        {texts.mostPopular}
                      </span>
                    </div>
                  )}
                  {servicio.novelty && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-orange-500/30 animate-pulse">
                        ✨ NOU
                      </span>
                    </div>
                  )}

                  {/* Emoji icon */}
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-3xl transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
                    {servicio.emoji}
                  </div>

                  <h2 className="mb-2 text-2xl font-bold text-white transition-colors group-hover:text-amber-400">
                    {servicio.name}
                  </h2>

                  <p className="text-sm font-medium text-amber-400/80 mb-3">
                    {servicio.tagline}
                  </p>

                  <p className="mb-5 leading-relaxed text-white/60">
                    {servicio.desc}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {servicio.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                        <span className="text-amber-400"><Icons.Check /></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={servicio.href}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-amber-400 font-semibold group-hover:gap-4 transition-all"
                  >
                    {texts.viewService}
                    <Icons.Arrow />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
              {texts.ctaTitle}
            </h2>
            <p className="text-xl text-white/60 mb-4">
              {texts.ctaSubtitle}
            </p>
            <p className="text-lg text-amber-400 font-medium mb-10">
              {texts.ctaResponseTime}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={WHATSAPP_URL_WITH_MESSAGE(texts.ctaWhatsappMessage)}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-[#25D366] hover:bg-[#20BD5A] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] text-white font-bold text-lg"
              >
                <Icons.WhatsApp />
                <span>{texts.ctaWhatsappButton}</span>
              </a>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-lg rounded-2xl transition-all hover:scale-105"
              >
                {texts.ctaButton}
                <Icons.Arrow />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}



