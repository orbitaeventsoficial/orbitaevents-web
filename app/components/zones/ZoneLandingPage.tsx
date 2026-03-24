'use client';

import { Link } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Check, ArrowRight, Star, Clock, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/app/config/site-config';
import Image from 'next/image';

export interface ZoneConfig {
  zone: string;
  zoneSlug: string;
  service: 'bodas' | 'discomovil' | 'fiestas';
  heroTitle: string;
  heroSubtitle: string;
  minPrice: number;
  towns: string[];
  highlights: string[];  // SEO keywords ara
  description: string;
  whyChooseUs: string[];
  faqs: Array<{ question: string; answer: string }>;
  heroImage?: string;  // Imatge hero de la zona
  galleryImages?: string[];  // Mini galeria de bodes
}

interface Props {
  config: ZoneConfig;
}

export default function ZoneLandingPage({ config }: Props) {
  const t = useTranslations('zoneLanding');

  const {
    zone,
    zoneSlug,
    service,
    heroTitle,
    heroSubtitle,
    minPrice,
    towns,
    highlights,
    description,
    whyChooseUs,
    faqs,
    heroImage,
    galleryImages,
  } = config;

  return (
    <main className="min-h-screen bg-[var(--bg-main)] relative">
      {/* Hero Section amb imatge */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background image */}
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={`Bodas en ${zone}`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[var(--bg-main)]" />
          </div>
        )}
        {!heroImage && (
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-main)]" />
        )}

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--oe-gold)]/20 border border-[var(--oe-gold)]/50 mb-6"
          >
            <MapPin className="w-4 h-4 text-[var(--oe-gold)]" />
            <span className="text-sm font-medium text-[var(--oe-gold)]">
              {t('specialistsIn')} {zone}
            </span>
          </motion.div>

          {/* Títol H1 - SEO optimitzat */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
          >
            {heroTitle}
          </motion.h1>

          {/* Subtítol amb pobles */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 mb-4"
          >
            {heroSubtitle}
          </motion.p>

          {/* Preu destacat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <span className="text-4xl md:text-5xl font-bold text-[var(--oe-gold)]">
              {t('fromPrice')} {minPrice}€
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              href={`/contacto?zona=${zoneSlug}&servicio=${service}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--oe-gold)] text-black font-bold rounded-full hover:bg-[var(--oe-gold-light)] transition-all duration-300 hover:scale-105"
            >
              {t('requestBudget')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={`tel:${SITE_CONFIG.business.phone}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <Phone className="w-5 h-5" />
              {t('callNow')}
            </a>
          </motion.div>

          {/* Keywords SEO - Més visuals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {highlights.map((highlight, index) => (
              <div
                key={highlight}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  ${index === 0
                    ? 'bg-[var(--oe-gold)] text-black'
                    : index === 1
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/10 text-white/90 border border-white/20'
                  }
                `}
              >
                <Check className="w-4 h-4" />
                {highlight}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Galeria de bodes a la zona */}
      {galleryImages && galleryImages.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {t('galleryTitle', { zone })}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryImages.slice(0, 4).map((img, index) => (
                <motion.div
                  key={img}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
                >
                  <Image
                    src={img}
                    alt={`Boda en ${zone} - ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link
                href="/portfolio/bodas"
                className="inline-flex items-center gap-2 text-[var(--oe-gold)] hover:underline"
              >
                {t('viewMoreWeddings')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contingut SEO */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">
            {t(`seoTitle.${service}`)} {zone}
          </h2>
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-white/80 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        </div>
      </section>

      {/* Per què escollir-nos */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            {t('whyChooseUs')} {zone}?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {whyChooseUs.map((reason) => (
              <div
                key={reason}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--oe-gold)]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-[var(--oe-gold)]" />
                </div>
                <p className="text-white/80">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pobles coberts */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            {t('townsTitle', { zone })}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {towns.map((town) => (
              <span
                key={town}
                className="px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm border border-white/10"
              >
                {town}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Què inclou */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            {t('whatIncluded')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--oe-gold)]/20 flex items-center justify-center">
                <Star className="w-8 h-8 text-[var(--oe-gold)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('includes.dj.title')}</h3>
              <p className="text-white/60 text-sm">
                {t('includes.dj.desc')}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--oe-gold)]/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[var(--oe-gold)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('includes.sound.title')}</h3>
              <p className="text-white/60 text-sm">
                {t('includes.sound.desc')}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--oe-gold)]/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-[var(--oe-gold)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('includes.allIncluded.title')}</h3>
              <p className="text-white/60 text-sm">
                {t('includes.allIncluded.desc')} {zone}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            {t('faqTitle')} {zone}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-white/10"
              >
                <h3 className="text-xl font-semibold text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-white/70 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {service === 'bodas' ? t('finalCta.titleBodas') : t('finalCta.titleOther')} {zone}?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            {t('finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/contacto?zona=${zoneSlug}&servicio=${service}`}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-[var(--oe-gold)] text-black font-bold text-lg rounded-full hover:bg-[var(--oe-gold-light)] transition-all duration-300 hover:scale-105"
            >
              {t('requestBudget')}
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
          <div className="mt-6 flex justify-center gap-6 text-sm text-white/60">
            <a href={`tel:${SITE_CONFIG.business.phone}`} className="flex items-center gap-2 hover:text-white">
              <Phone className="w-4 h-4" />
              {SITE_CONFIG.business.phoneDisplay}
            </a>
            <a href={`mailto:${SITE_CONFIG.business.email}`} className="flex items-center gap-2 hover:text-white">
              <Mail className="w-4 h-4" />
              {SITE_CONFIG.business.email}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
