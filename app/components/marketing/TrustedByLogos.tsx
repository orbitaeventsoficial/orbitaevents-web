// app/components/marketing/TrustedByLogos.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - TRUSTED BY LOGOS - Desktop marquee
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const CLIENT_LOGOS = [
  '/img/logos/cliente1.webp',
  '/img/logos/cliente2.webp',
  '/img/logos/cliente3.webp',
  '/img/logos/cliente4.webp',
  '/img/logos/cliente5.webp',
  '/img/logos/cliente6.webp',
  '/img/logos/cliente7.webp',
  '/img/logos/cliente8.webp',
];

export default function TrustedByLogos() {
  const t = useTranslations('homePage.trustedBy');
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-16 bg-[#0A0A0A] overflow-hidden">
      <div className="container mx-auto px-6 mb-10">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-white/40 text-sm font-semibold tracking-widest uppercase"
        >
          {t('sectionTitle')}
        </motion.p>
      </div>

      {/* Infinite scroll marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-12 items-center"
          animate={reduceMotion ? {} : { x: ['0%', '-50%'] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { x: { duration: 30, repeat: Infinity, ease: 'linear' } }
          }
        >
          {/* Triple the logos for seamless loop on wide screens */}
          {[...CLIENT_LOGOS, ...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-24 h-24 relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <Image
                src={logo}
                alt={`Cliente ${(i % CLIENT_LOGOS.length) + 1}`}
                fill
                sizes="96px"
                className="object-contain p-1"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
