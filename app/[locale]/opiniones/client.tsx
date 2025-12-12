"use client";
import { SITE_CONFIG } from '@/config/site-config';
import NextImage from "next/image";
import { useState } from "react";
import Link from "next/link";
import { Star, Filter, MessageCircle } from "lucide-react";
import { useTranslations } from 'next-intl';

function buildWhatsAppUrl(message: string): string {
  const { number } = SITE_CONFIG.whatsapp;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number.replace(/\+/g, '')}?text=${encodedMessage}`;
}

type Review = {
  author: string;
  role?: string;
  event: string;
  rating: number;
  date: string;
  text: string;
  photo?: string;
};

// TESTIMONI DEL FUNDADOR - Casament pendent (Juliol 2025)
// NOTA: Encara no celebrat - mostrar com a "Pròximament"
// Dades amb keys de traducció per role i date
const REVIEWS_DATA = [
  {
    author: "Lorena i Carles",
    roleKey: "founderRole",
    eventKey: "founderEvent",
    rating: 5,
    dateKey: "comingSoon",
    textKey: "founderText",
    photo: "/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg",
  },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < n ? 'text-[var(--oe-gold)] fill-[var(--oe-gold)]' : 'text-white/30'}`} />
      ))}
    </span>
  );
}

type FilterType = "all" | "bodas" | "fiestas" | "empresas";

export default function OpinionesClient() {
  const t = useTranslations('reviews');
  const [filter, setFilter] = useState<FilterType>("all");

  // Crear REVIEWS amb traduccions
  const REVIEWS: Review[] = REVIEWS_DATA.map(r => ({
    author: r.author,
    role: t(r.roleKey),
    event: t(r.eventKey),
    rating: r.rating,
    date: t(r.dateKey),
    text: t(r.textKey),
    photo: r.photo,
  }));

  const AVG = REVIEWS.length > 0
    ? (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1)
    : "0";

  const filteredReviews = REVIEWS.filter((r) => {
    if (filter === "all") return true;
    return r.role?.toLowerCase().includes(filter);
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-xl text-white/70 mb-6">
          {t('subtitle')}
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 px-2">
          {[
            { id: "all", label: t('filters.all') },
            { id: "bodas", label: t('filters.weddings') },
            { id: "fiestas", label: t('filters.parties') },
            { id: "empresas", label: t('filters.corporate') },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as FilterType)}
              className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl border transition-all text-sm sm:text-base ${
                filter === f.id ? "bg-[var(--oe-gold)] text-black border-[var(--oe-gold)]" : "bg-white/5 border-white/20 hover:bg-white/10"
              }`}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-3xl font-extrabold" aria-label={`Media ${AVG} sobre 5`}>
            {AVG}
          </div>
          <Stars n={5} />
          <div className="text-sm text-white/70">
            {REVIEWS.length} {t('verifiedReviews')}
          </div>
        </div>
      </div>

      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredReviews.map((r, i) => (
          <li
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 oe-card transition-all duration-300 hover:border-[var(--oe-gold)]/30 hover:shadow-[0_0_0_1px_rgba(215,184,110,.25)]"
            itemScope
            itemType="https://schema.org/Review"
          >
            {r.photo && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden mb-3">
                <NextImage src={r.photo} alt={r.author} fill={true} sizes="48px" className="object-cover" unoptimized />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="font-semibold" itemProp="author">
                {r.author}
              </div>
              <time className="text-sm text-white/60" dateTime={`${r.date}-01`}>
                {r.date}
              </time>
            </div>
            <div className="mt-0.5 text-xs text-white/50">
              {r.role} · {r.event}
            </div>
            <div className="mt-2">
              <Stars n={r.rating} />
            </div>
            <p className="mt-3 leading-relaxed text-white/80" itemProp="reviewBody">
              {r.text}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-12 text-center">
        <p className="text-xl text-white/80 mb-6">
          {t('cta.title')}
        </p>
        <div className="flex justify-center gap-4">
          {SITE_CONFIG.reviews.googleBusinessUrl ? (
            <Link
              href={SITE_CONFIG.reviews.googleBusinessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="oe-btn oe-btn-gold flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t('cta.leaveReview')}
            </Link>
          ) : (
            <Link
              href={buildWhatsAppUrl(t('cta.whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              className="oe-btn oe-btn-gold flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t('cta.contactUs')}
            </Link>
          )}
          <Link
            href="/contacto"
            className="oe-btn flex items-center gap-2"
          >
            {t('cta.requestQuote')}
          </Link>
        </div>
      </div>
    </main>
  );
}

