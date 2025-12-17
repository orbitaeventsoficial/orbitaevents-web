// app/components/home/TestimoniosReales.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - TESTIMONIOS REALES v1.0
// ═══════════════════════════════════════════════════════════════════════════
//
// Testimonios que CONVIERTEN:
// - Fotos reales de clientes
// - Estrellas de valoración
// - Fecha del evento
// - Tipo de evento (boda, fiesta, empresa)
// - Video testimonials opcionales
// - Carousel automático
// - Modal de video
// - Integración con Google Reviews / Bodas.net
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
  eventType: 'boda' | 'fiesta' | 'empresa' | 'tematica';
  location?: string;
  videoUrl?: string;
  verified?: boolean;
  source?: 'google' | 'bodas.net' | 'direct';
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS PER TESTIMONIS DES DE JSON
// ═══════════════════════════════════════════════════════════════════════════

interface TranslatedTestimonial {
  id: string;
  translationKey: string;
  avatar?: string;
  rating: number;
  eventType: 'boda' | 'fiesta' | 'empresa' | 'tematica';
  location?: string;
  verified: boolean;
  source: 'google' | 'bodas.net' | 'direct';
}

// 3 testimonis amb dades i claus de traducció
const TESTIMONIALS_CONFIG: TranslatedTestimonial[] = [
  {
    id: '1',
    translationKey: 'testimonial1',
    avatar: '/img/testimonials/lorena-carles.webp',
    rating: 5,
    eventType: 'tematica',
    location: 'Girona',
    verified: true,
    source: 'google'
  },
  {
    id: '2',
    translationKey: 'testimonial2',
    avatar: '/img/testimonials/marc-puig.webp',
    rating: 5,
    eventType: 'fiesta',
    location: 'Barcelona',
    verified: true,
    source: 'bodas.net'
  },
  {
    id: '3',
    translationKey: 'testimonial3',
    avatar: '/img/testimonials/anna-garcia.webp',
    rating: 5,
    eventType: 'empresa',
    location: 'Barcelona',
    verified: true,
    source: 'direct'
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Star: ({ filled }: { filled: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Quote: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.1">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  ),
  Verified: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
    </svg>
  ),
  Google: () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  BodasNet: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF6B6B">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Rating Stars
// ═══════════════════════════════════════════════════════════════════════════

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icons.Star key={star} filled={star <= rating} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Source Badge
// ═══════════════════════════════════════════════════════════════════════════

function SourceBadge({ source, t }: { source?: string; t: (key: string) => string }) {
  if (!source) return null;

  const config = {
    google: { icon: <Icons.Google />, label: 'Google', color: 'bg-white/10' },
    'bodas.net': { icon: <Icons.BodasNet />, label: 'Bodas.net', color: 'bg-rose-500/10' },
    direct: { icon: <Icons.Verified />, label: t('verified'), color: 'bg-emerald-500/10' },
  };

  const { icon, label, color } = config[source as keyof typeof config] || config.direct;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${color} rounded-full text-xs text-white/70`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Event Type Badge
// ═══════════════════════════════════════════════════════════════════════════

function EventTypeBadge({ type, t }: { type: string; t: (key: string) => string }) {
  const config: Record<string, { emoji: string; color: string }> = {
    boda: { emoji: '💍', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
    fiesta: { emoji: '🎉', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
    empresa: { emoji: '💼', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
    tematica: { emoji: '🎃', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30' },
  };

  const { emoji, color } = config[type] || config.fiesta;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r ${color} border rounded-full text-xs font-medium text-white/80`}>
      <span>{emoji}</span>
      <span>{t(`eventTypes.${type}`)}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Testimonial Card amb Traduccions
// ═══════════════════════════════════════════════════════════════════════════

function TranslatedTestimonialCard({
  config,
  t,
  tStats
}: {
  config: TranslatedTestimonial;
  t: (key: string) => string;
  tStats: (key: string) => string;
}) {
  const { translationKey, avatar, rating, eventType, location, verified, source } = config;

  // Obtenir traduccions
  const author = t(`${translationKey}.author`);
  const role = t(`${translationKey}.role`);
  const quote = t(`${translationKey}.quote`);
  const date = t(`${translationKey}.date`);
  const highlight = t(`${translationKey}.highlight`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-amber-500/5 hover:shadow-amber-500/10 transition-shadow"
    >
      {/* Quote icon */}
      <div className="absolute top-6 right-6">
        <Icons.Quote />
      </div>

      {/* Highlight badge */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm font-medium">
          {highlight}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Avatar */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 flex-shrink-0">
          {avatar ? (
            <Image
              src={avatar}
              alt={author}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
              {author.charAt(0)}
            </div>
          )}
          {verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
              <Icons.Verified />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-lg">{author}</h4>
          <p className="text-sm text-white/60 truncate">{role}</p>
          <div className="flex items-center gap-3 mt-2">
            <RatingStars rating={rating} />
            <SourceBadge source={source} t={tStats} />
          </div>
        </div>
      </div>

      {/* Text */}
      <blockquote className="text-white/80 text-base leading-relaxed mb-6 line-clamp-4">
        "{quote}"
      </blockquote>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <EventTypeBadge type={eventType} t={t} />
        <div className="flex items-center gap-2 text-sm text-white/50">
          {location && (
            <>
              <span>📍 {location}</span>
              <span>•</span>
            </>
          )}
          <span>{date}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Summary Stats
// ═══════════════════════════════════════════════════════════════════════════

function SummaryStats({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-12">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-zinc-900 flex items-center justify-center text-xs font-bold text-white">
              {['M', 'L', 'A', 'J', 'P'][i - 1]}
            </div>
          ))}
        </div>
        <div className="text-sm">
          <span className="text-white font-bold">+150</span>
          <span className="text-white/60"> {t('satisfiedClients')}</span>
        </div>
      </div>

      <div className="h-8 w-px bg-white/10 hidden md:block" />

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 text-amber-400">
          {[1, 2, 3, 4, 5].map((i) => (
            <Icons.Star key={i} filled={true} />
          ))}
        </div>
        <span className="text-white font-bold">4.9</span>
        <span className="text-white/60 text-sm">{t('averageRating')}</span>
      </div>

      <div className="h-8 w-px bg-white/10 hidden md:block" />

      <div className="flex items-center gap-3">
        <Icons.Google />
        <Icons.BodasNet />
        <span className="text-white/60 text-sm">{t('verifiedReviews')}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL - 3 Testimonis en Grid
// ═══════════════════════════════════════════════════════════════════════════

export default function TestimoniosReales() {
  const t = useTranslations('testimonials');
  const tStats = useTranslations('homeSections.testimonials');

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.05),transparent_70%)]" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            {t('title')} <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{t('titleHighlight')}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Summary Stats */}
        <SummaryStats t={tStats} />

        {/* 3 Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS_CONFIG.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <TranslatedTestimonialCard
                config={config}
                t={t}
                tStats={tStats}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-white/60 mb-4">
            {t('cta')}
          </p>
          <a
            href="/contacto"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-2xl transition-all hover:scale-105"
          >
            <span>{t('ctaButton')}</span>
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
