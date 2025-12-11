"use client";
// app/components/marketing/VideoTestimonials.tsx
// ACTUALITZACIÓ: Testimoni del fundador (casament pendent Juliol 2025)

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, MapPin, Clock, Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

// TESTIMONI DEL FUNDADOR - Casament pendent (Juliol 2025)
// NOTA: Aquest és el casament del fundador d'Òrbita Events, encara no celebrat
const REAL_TESTIMONIAL = {
  name: 'Lorena i Carles',
  event: 'Casament Món Màgic',
  date: 'Pròximament',
  location: 'Catalunya',
  quote: {
    ca: "Estem preparant el nostre casament temàtic amb Òrbita Events. La planificació ha estat increïble: veles flotants, sobres personalitzats amb lacre vermell, decoració amb símbols màgics... Estem molt il·lusionats!",
    es: "Estamos preparando nuestra boda temática con Òrbita Events. La planificación ha sido increíble: velas flotantes, sobres personalizados con lacre rojo, decoración con símbolos mágicos... ¡Estamos muy ilusionados!"
  },
  image: '/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg',
  rating: 5,
  verified: false  // Canviat a false perquè encara no ha passat
};

function VideoTestimonials() {
  const t = useTranslations('testimonials');
  const locale = useLocale();

  const quote = locale === 'ca' ? REAL_TESTIMONIAL.quote.ca : REAL_TESTIMONIAL.quote.es;
  const texts = {
    ca: {
      badge: 'Proper Casament',
      upcomingEvent: 'Pròximament',
      wantSame: 'Vols una experiència així?',
      seeHP: 'Descobreix Món Màgic',
      leaveReview: 'Deixa la teva opinió',
      hadEvent: 'Has celebrat un event amb nosaltres?'
    },
    es: {
      badge: 'Próxima Boda',
      upcomingEvent: 'Próximamente',
      wantSame: '¿Quieres una experiencia así?',
      seeHP: 'Descubre Mundo Mágico',
      leaveReview: 'Deja tu opinión',
      hadEvent: '¿Has celebrado un evento con nosotros?'
    }
  };
  const content = locale === 'ca' ? texts.ca : texts.es;

  return (
    <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-main via-bg-surface to-bg-main overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        {/* Title */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
              <Clock className="w-4 h-4" />
              {content.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4">
              {t('title')}
              <span className="text-oe-gold"> {t('titleHighlight')}</span>
            </h2>
          </motion.div>
        </div>

        {/* Testimoni Destacat - Lorena i Carles */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative bg-gradient-to-br from-bg-surface to-bg-card rounded-3xl border border-oe-gold/20 overflow-hidden shadow-2xl"
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Imatge */}
            <div className="relative aspect-[4/3] md:aspect-auto">
              <Image
                src={REAL_TESTIMONIAL.image}
                alt={`Casament de ${REAL_TESTIMONIAL.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-bg-surface/80 hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent md:hidden" />

              {/* Badge pròximament */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/90 backdrop-blur rounded-full">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">{content.upcomingEvent}</span>
              </div>

              {/* Event badge */}
              <div className="absolute bottom-4 left-4 md:hidden">
                <div className="px-4 py-2 bg-oe-gold/90 rounded-full">
                  <span className="text-black font-bold text-sm">{REAL_TESTIMONIAL.event}</span>
                </div>
              </div>
            </div>

            {/* Contingut */}
            <div className="relative p-8 md:p-12 flex flex-col justify-center">
              {/* Quote decoratiu */}
              <Quote className="w-12 h-12 text-oe-gold/20 absolute top-6 left-6" />

              <div className="relative z-10">
                {/* Event badge desktop */}
                <div className="hidden md:inline-block px-4 py-2 bg-oe-gold/20 rounded-full mb-6">
                  <span className="text-oe-gold font-bold text-sm">{REAL_TESTIMONIAL.event}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(REAL_TESTIMONIAL.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-oe-gold text-oe-gold" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-lg md:text-xl text-white/90 italic leading-relaxed mb-8">
                  "{quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-oe-gold to-amber-600 flex items-center justify-center text-2xl">
                    ⚡
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{REAL_TESTIMONIAL.name}</p>
                    <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                      <MapPin className="w-4 h-4 text-oe-gold" />
                      <span>{REAL_TESTIMONIAL.location}</span>
                      <span className="text-oe-gold">•</span>
                      <span>{REAL_TESTIMONIAL.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA - Vols el mateix? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-white/60 mb-6">{content.wantSame}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tematica-mon-magic"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              <Sparkles className="w-5 h-5" />
              {content.seeHP}
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition"
            >
              {t('ctaButton')}
            </Link>
          </div>
        </motion.div>

        {/* CTA per deixar review */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16 pt-8 border-t border-white/10"
        >
          <p className="text-white/50 mb-4">{content.hadEvent}</p>
          <Link
            href="/opiniones/nueva"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white/70 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition"
          >
            <Star className="w-4 h-4" />
            {content.leaveReview}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(VideoTestimonials);
