"use client";
import { SITE_CONFIG } from '@/config/site-config';
import NextImage from "next/image";
import { useState } from "react";
import { Link } from '@/lib/navigation';
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// OPINIONS CLIENT v2.0 - ESTIL ELEGANT
// ═══════════════════════════════════════════════════════════════════════════

function buildWhatsAppUrl(message: string): string {
  const { number } = SITE_CONFIG.whatsapp;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number.replace(/\+/g, '')}?text=${encodedMessage}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONES
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
    </svg>
  ),
  Google: () => (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  BodasNet: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF6B6B">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Filter: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
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

function SourceBadge({ source, verifiedLabel }: { source?: string; verifiedLabel: string }) {
  if (!source) return null;

  const config = {
    google: { icon: <Icons.Google />, label: 'Google', color: 'bg-white/10' },
    direct: { icon: <Icons.Verified />, label: verifiedLabel, color: 'bg-emerald-500/10' },
  };

  const { icon, label, color } = config[source as keyof typeof config] || config.direct;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 ${color} rounded-full text-xs text-white/70`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

function EventTypeBadge({ type, eventTypeLabels }: { type: string; eventTypeLabels: Record<string, string> }) {
  const config: Record<string, { emoji: string; color: string }> = {
    bodas: { emoji: '💍', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
    fiestas: { emoji: '🎉', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
    empresas: { emoji: '💼', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
    tematica: { emoji: '🎃', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30' },
    infantil: { emoji: '🎈', color: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30' },
  };

  const { emoji, color } = config[type] || config.fiestas;
  const label = eventTypeLabels[type] || type;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r ${color} border rounded-full text-xs font-medium text-white/80`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DADES DE REVIEWS
// ═══════════════════════════════════════════════════════════════════════════

type Review = {
  author: string;
  role?: string;
  event: string;
  eventType: string;
  rating: number;
  date: string;
  text: string;
  photo?: string;
  source?: 'google' | 'direct';
  verified?: boolean;
};

const REVIEWS_DATA = [
  {
    author: "Maria i Jordi",
    roleKey: "review1Role",
    eventKey: "review1Event",
    eventType: "bodas",
    rating: 5,
    dateKey: "review1Date",
    textKey: "review1Text",
    photo: "/img/portfolio/bodas/bodas-01.webp",
    source: "direct" as const,
    verified: true,
  },
  {
    author: "Anna G.",
    roleKey: "review2Role",
    eventKey: "review2Event",
    eventType: "fiestas",
    rating: 5,
    dateKey: "review2Date",
    textKey: "review2Text",
    photo: "/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp",
    source: "google" as const,
    verified: true,
  },
  {
    author: "Marc i Laura",
    roleKey: "review3Role",
    eventKey: "review3Event",
    eventType: "infantil",
    rating: 5,
    dateKey: "review3Date",
    textKey: "review3Text",
    photo: "/img/portfolio/fiestas-infantiles/fiestas-infantiles-01.webp",
    source: "direct" as const,
    verified: true,
  },
  {
    author: "Sandra M.",
    roleKey: "review4Role",
    eventKey: "review4Event",
    eventType: "empresas",
    rating: 5,
    dateKey: "review4Date",
    textKey: "review4Text",
    photo: "/img/portfolio/eventos-empresa/eventos-empresa-01.webp",
    source: "google" as const,
    verified: true,
  },
  {
    author: "Lorena i Carles",
    roleKey: "founderRole",
    eventKey: "founderEvent",
    eventType: "tematica",
    rating: 5,
    dateKey: "comingSoon",
    textKey: "founderText",
    photo: "/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp",
    source: "direct" as const,
    verified: true,
  },
];

type FilterType = "all" | "bodas" | "fiestas" | "empresas";

export default function OpinionesClient() {
  const t = useTranslations('reviews');
  const [filter, setFilter] = useState<FilterType>("all");

  // Get event type labels from translations
  const eventTypeLabels: Record<string, string> = {
    bodas: t('page.eventTypes.bodas'),
    fiestas: t('page.eventTypes.fiestas'),
    empresas: t('page.eventTypes.empresas'),
    tematica: t('page.eventTypes.tematica'),
    infantil: t('page.eventTypes.infantil'),
  };

  // Crear REVIEWS amb traduccions
  const REVIEWS: Review[] = REVIEWS_DATA.map(r => ({
    author: r.author,
    role: t(r.roleKey),
    event: t(r.eventKey),
    eventType: r.eventType,
    rating: r.rating,
    date: t(r.dateKey),
    text: t(r.textKey),
    photo: r.photo,
    source: r.source,
    verified: r.verified,
  }));

  const AVG = REVIEWS.length > 0
    ? (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1)
    : "0";

  const filteredReviews = REVIEWS.filter((r) => {
    if (filter === "all") return true;
    return r.eventType === filter || r.role?.toLowerCase().includes(filter);
  });

  const filterButtons = [
    { id: "all", label: t('filters.all') },
    { id: "bodas", label: t('filters.weddings') },
    { id: "fiestas", label: t('filters.parties') },
    { id: "empresas", label: t('filters.corporate') },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.05),transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
            ⭐ {t('page.badge')}
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 text-white">
            {t('page.titlePart1')}{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {t('page.titleHighlight')}
            </span>
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['M', 'L', 'A', 'J', 'P'].map((initial, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-zinc-900 flex items-center justify-center text-xs font-bold text-white">
                    {initial}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-white font-bold">+150</span>
                <span className="text-white/60"> {t('page.stats.clients')}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="flex items-center gap-2">
              <RatingStars rating={5} />
              <span className="text-white font-bold">{AVG}</span>
              <span className="text-white/60 text-sm">{t('page.stats.averageRating')}</span>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="flex items-center gap-3">
              <Icons.Google />
              <Icons.BodasNet />
              <span className="text-white/60 text-sm">{t('page.stats.verified')}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {filterButtons.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as FilterType)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  filter === f.id
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-500"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70 hover:text-white"
                }`}
              >
                <Icons.Filter />
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-2xl shadow-amber-500/5 hover:shadow-amber-500/10 hover:border-amber-500/20 transition-all"
              itemScope
              itemType="https://schema.org/Review"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6">
                <Icons.Quote />
              </div>

              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                {/* Avatar with verification badge outside */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500">
                    {r.photo ? (
                      <NextImage
                        src={r.photo}
                        alt={r.author}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                        {r.author.charAt(0)}
                      </div>
                    )}
                  </div>
                  {r.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-900 shadow-lg">
                      <Icons.Verified />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-lg" itemProp="author">{r.author}</h4>
                  <p className="text-sm text-white/60 truncate">{r.role}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <RatingStars rating={r.rating} />
                    <SourceBadge source={r.source} verifiedLabel={t('page.verified')} />
                  </div>
                </div>
              </div>

              {/* Text */}
              <blockquote className="text-white/80 text-base leading-relaxed mb-5" itemProp="reviewBody">
                "{r.text}"
              </blockquote>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <EventTypeBadge type={r.eventType} eventTypeLabels={eventTypeLabels} />
                <time className="text-sm text-white/50" dateTime={r.date}>
                  {r.date}
                </time>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Leave Review CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link
            href="/opiniones/nueva"
            className="group inline-block"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-amber-400 transition-colors mb-2">
              {t('page.shareExperienceTitle')}
            </h2>
            <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-orange-300 transition-all flex items-center justify-center gap-2">
              {t('page.shareExperienceCta')}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </p>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
