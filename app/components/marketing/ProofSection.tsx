"use client";

// app/components/marketing/ProofSection.tsx
import { SITE_CONFIG } from '@/config/site-config';
import { Star, Users, Calendar, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Els src dels logos són fixes; els alt vindran de traduccions
const clientLogoSrcs = [
  '/img/logos/cliente1.webp',
  '/img/logos/cliente2.webp',
  '/img/logos/cliente3.webp',
  '/img/logos/cliente4.webp',
  '/img/logos/cliente5.webp',
  '/img/logos/cliente6.webp',
  '/img/logos/cliente7.webp',
  '/img/logos/cliente8.webp',
];

export default function ProofSection() {
  const t = useTranslations('proof');
  const tStats = useTranslations('stats');
  const tLogos = useTranslations('logoWall');

  // Genera logos amb alt text traduït
  const clientLogos = clientLogoSrcs.map((src, idx) => ({
    src,
    alt: tLogos(`clients.${idx}`),
  }));

  const validLogos = clientLogos.filter(logo => logo.src);
  if (validLogos.length === 0) return null;

  // Stats dinámicos desde SITE_CONFIG + traducciones
  const stats = [
    { icon: Calendar, value: `+${SITE_CONFIG.stats.eventsCompleted}`, label: tStats('eventsCompleted'), color: 'text-oe-gold' },
    { icon: Users, value: `+${(SITE_CONFIG.stats.peoplesDancing / 1000).toFixed(0)}K`, label: tStats('peopleDancing'), color: 'text-oe-gold' },
    { icon: Star, value: `${SITE_CONFIG.stats.recommendRate}%`, label: tStats('recommendRate'), color: 'text-oe-gold' },
    { icon: Award, value: `${SITE_CONFIG.stats.yearsExperience}`, label: tStats('yearsExperience'), color: 'text-oe-gold' },
  ];

  const containerSize = 'w-40 h-40';
  const logoWidth = 180;
  const itemWidth = 160 + 32;

  // DUPLICAR SOLO LOS LOGOS VÁLIDOS → LOOP PERFECTO SIN HUECOS
  const loopLogos = [...validLogos, ...validLogos];
  const translateDistance = -(itemWidth * validLogos.length);

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-bg-main to-bg-surface relative overflow-hidden">
      {/* 🔥 PARTÍCULAS FLOTANTES BRUTALES */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
        <div
          className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-oe-gold/40 to-yellow-400/20 blur-3xl top-[15%] left-[8%] animate-float"
          style={{ animationDuration: "6s", animationDelay: "0s" }}
        />
        <div
          className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-oe-gold/30 to-yellow-400/15 blur-3xl bottom-[20%] right-[12%] animate-float"
          style={{ animationDuration: "7s", animationDelay: "2s" }}
        />
        <div
          className="absolute w-24 h-24 rounded-full bg-purple-500/25 blur-2xl top-[50%] right-[20%] animate-scale-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-oe-gold/20 border border-oe-gold px-4 py-2 mb-6
                     hover:scale-110 transition-transform duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles className="w-4 h-4 text-oe-gold animate-rotate-slow" />
            <span className="text-sm font-medium text-oe-gold">{t('badge')}</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
            {t('title')} <span className="text-oe-gold">+{SITE_CONFIG.stats.eventsCompleted} {t('titleHighlight')}</span> {t('titleEnd')}
          </h2>

          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="text-center group cursor-default"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.25 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center
                              group-hover:bg-zinc-700/70 group-hover:border-oe-gold/40 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1
                              shadow-[0_4px_20px_rgba(0,0,0,0.3)] group-hover:shadow-[0_8px_30px_rgba(218,165,32,0.15)]">
                  <Icon className={`w-8 h-8 ${stat.color} group-hover:scale-125 transition-transform`} />
                </div>
                <div className="text-5xl md:text-6xl font-black text-white mb-2 group-hover:text-oe-gold
                              transition-colors group-hover:drop-shadow-[0_0_15px_rgba(218,165,32,0.7)]">{stat.value}</div>
                <p className="text-base text-text-muted font-medium group-hover:text-white transition-colors">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CARRUSEL: LOOP LIMPIO → SOLO LOGOS EXISTENTES */}
        <div className="overflow-hidden">
          <h3 className="text-center text-2xl md:text-3xl font-display font-bold text-white mb-8">
            {t('trustedBy')}
          </h3>
          
          <div className="relative">
            {/* Fade lateral */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg-surface to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg-surface to-transparent z-10 pointer-events-none" />

            {/* Carrusel */}
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-8 items-center"
                animate={{ x: [0, translateDistance] }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 20 + (validLogos.length * 1.5),
                    ease: "linear",
                  },
                }}
              >
                {loopLogos.map((logo, idx) => (
                  <div
                    key={`${logo.alt}-${idx}`}
                    className={`flex-shrink-0 ${containerSize}`}
                  >
                    <div className="relative w-full h-full rounded-3xl border border-oe-gold p-3 flex items-center justify-center group transition-all duration-300">
                      {/* GLOW VISIBLE + ANIMADO */}
                      <div className="absolute inset-0 rounded-3xl bg-oe-gold/30 blur-3xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 pointer-events-none" />
                      <div className="absolute inset-0 rounded-3xl bg-oe-gold/20 blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />
                      
                      {/* LOGO */}
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={logoWidth}
                        height={logoWidth}
                        className="object-contain w-full h-full relative z-10 drop-shadow-lg"
                        loading="lazy"
                        onError={(e) => {
                          // Si falla → se elimina del DOM → loop se ajusta solo
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.parentElement?.remove();
                        }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

