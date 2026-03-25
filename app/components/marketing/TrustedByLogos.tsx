// app/components/marketing/TrustedByLogos.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - TRUSTED BY LOGOS - Desktop marquee
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CLIENT_LOGOS } from '@/app/config/client-logos';

export default function TrustedByLogos() {
  const t = useTranslations('homePage.trustedBy');
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-16 bg-gradient-to-b from-zinc-950 via-bg-main to-zinc-950 overflow-hidden">
      <style jsx>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 35s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>

      <div className="container mx-auto mb-10 px-6">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center text-sm font-semibold uppercase tracking-[0.25em] text-zinc-200/95"
        >
          {t('sectionTitle')}
        </motion.p>
      </div>

      {/* Infinite scroll marquee */}
      <div className="relative">
        {/* Ambient glow behind marquee */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(251,191,36,0.06),transparent_70%)] blur-2xl" />
        </div>
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div className="marquee-track flex items-center w-max">
          {/* Two identical blocks — scrolling exactly one block width = seamless loop */}
          {[0, 1].map((block) => (
            <div key={block} className="flex gap-10 items-center px-5">
              {CLIENT_LOGOS.map((logo, i) => (
                <div
                  key={`${block}-${i}`}
                  className="flex-shrink-0 w-40 h-40 relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300"
                >
                  <Image
                    src={logo}
                    alt={`Cliente ${i + 1}`}
                    fill
                    sizes="160px"
                    className="object-contain p-1"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
