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

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useInView } from 'framer-motion';
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
// DATOS MOCK - REEMPLAZAR CON API/PRISMA
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Maria i Jordi',
    role: 'Casament a Mas Terrats',
    avatar: '/img/testimonials/maria-jordi.webp',
    rating: 5,
    text: 'Increïble! Van fer que el nostre casament fos màgic. La tematització Harry Potter va deixar a tots amb la boca oberta. Els convidats encara en parlen!',
    date: '2024-09-14',
    eventType: 'boda',
    location: 'Girona',
    verified: true,
    source: 'google'
  },
  {
    id: '2',
    name: 'Laura Martínez',
    role: 'Festa 40 aniversari',
    avatar: '/img/testimonials/laura.webp',
    rating: 5,
    text: 'La millor festa que hem fet mai! El DJ va saber llegir perfectament l\'ambient i la gent no va parar de ballar. Repetirem segur!',
    date: '2024-10-28',
    eventType: 'fiesta',
    location: 'Barcelona',
    verified: true,
    source: 'bodas.net'
  },
  {
    id: '3',
    name: 'TechCorp BCN',
    role: 'Event corporatiu anual',
    avatar: '/img/testimonials/techcorp.webp',
    rating: 5,
    text: 'Professionalitat màxima. Van gestionar tot l\'audiovisual del nostre event de 200 persones sense cap problema. El so i les llums, espectaculars.',
    date: '2024-11-15',
    eventType: 'empresa',
    location: 'Barcelona',
    verified: true,
    source: 'direct'
  },
  {
    id: '4',
    name: 'Família Puig',
    role: 'Festa Halloween infantil',
    avatar: '/img/testimonials/familia-puig.webp',
    rating: 5,
    text: 'Els nens van flipar amb la decoració de Halloween! L\'animació va ser genial i els efectes de fum i llum van crear un ambient increïble.',
    date: '2024-10-31',
    eventType: 'tematica',
    location: 'Granollers',
    verified: true,
    source: 'google'
  },
  {
    id: '5',
    name: 'Anna i Marc',
    role: 'Casament a Can Ribas',
    avatar: '/img/testimonials/anna-marc.webp',
    rating: 5,
    text: 'Des del primer moment ens van entendre perfectament. La coordinació el dia del casament va ser impecable. 100% recomanables!',
    date: '2024-08-24',
    eventType: 'boda',
    location: 'Maresme',
    verified: true,
    source: 'bodas.net'
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
  Play: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
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
  ChevronLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
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

function SourceBadge({ source, isEs }: { source?: string; isEs: boolean }) {
  if (!source) return null;

  const config = {
    google: { icon: <Icons.Google />, label: 'Google', color: 'bg-white/10' },
    'bodas.net': { icon: <Icons.BodasNet />, label: 'Bodas.net', color: 'bg-rose-500/10' },
    direct: { icon: <Icons.Verified />, label: isEs ? 'Verificado' : 'Verificat', color: 'bg-emerald-500/10' },
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

function EventTypeBadge({ type, isEs }: { type: string; isEs: boolean }) {
  const config: Record<string, { emoji: string; labelCa: string; labelEs: string; color: string }> = {
    boda: { emoji: '💍', labelCa: 'Casament', labelEs: 'Boda', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
    fiesta: { emoji: '🎉', labelCa: 'Festa', labelEs: 'Fiesta', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
    empresa: { emoji: '💼', labelCa: 'Empresa', labelEs: 'Empresa', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
    tematica: { emoji: '🎃', labelCa: 'Temàtica', labelEs: 'Temática', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30' },
  };

  const { emoji, labelCa, labelEs, color } = config[type] || config.fiesta;
  const label = isEs ? labelEs : labelCa;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r ${color} border rounded-full text-xs font-medium text-white/80`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Testimonial Card
// ═══════════════════════════════════════════════════════════════════════════

function TestimonialCard({ testimonial, isActive, isEs }: { testimonial: Testimonial; isActive: boolean; isEs: boolean }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isEs ? 'es-ES' : 'ca-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1 : 0.95 }}
      transition={{ duration: 0.4 }}
      className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8 ${isActive ? 'shadow-2xl shadow-amber-500/10' : ''}`}
    >
      {/* Quote icon */}
      <div className="absolute top-6 right-6">
        <Icons.Quote />
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Avatar */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 flex-shrink-0">
          {testimonial.avatar ? (
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
              {testimonial.name.charAt(0)}
            </div>
          )}
          {testimonial.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
              <Icons.Verified />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-lg">{testimonial.name}</h4>
          {testimonial.role && (
            <p className="text-sm text-white/60 truncate">{testimonial.role}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <RatingStars rating={testimonial.rating} />
            <SourceBadge source={testimonial.source} isEs={isEs} />
          </div>
        </div>
      </div>

      {/* Text */}
      <blockquote className="text-white/80 text-base md:text-lg leading-relaxed mb-6">
        "{testimonial.text}"
      </blockquote>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <EventTypeBadge type={testimonial.eventType} isEs={isEs} />
        <div className="flex items-center gap-2 text-sm text-white/50">
          {testimonial.location && (
            <>
              <span>📍 {testimonial.location}</span>
              <span>•</span>
            </>
          )}
          <span>{formatDate(testimonial.date)}</span>
        </div>
      </div>

      {/* Video button if available */}
      {testimonial.videoUrl && (
        <button className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
          <Icons.Play />
        </button>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Summary Stats
// ═══════════════════════════════════════════════════════════════════════════

function SummaryStats({ isEs }: { isEs: boolean }) {
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
          <span className="text-white/60"> {isEs ? 'clientes satisfechos' : 'clients satisfets'}</span>
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
        <span className="text-white/60 text-sm">{isEs ? 'valoración media' : 'valoració mitjana'}</span>
      </div>

      <div className="h-8 w-px bg-white/10 hidden md:block" />

      <div className="flex items-center gap-3">
        <Icons.Google />
        <Icons.BodasNet />
        <span className="text-white/60 text-sm">{isEs ? 'Opiniones verificadas' : 'Opinions verificades'}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

interface TestimoniosRealesProps {
  testimonials?: Testimonial[];
  autoplay?: boolean;
  autoplayInterval?: number;
}

export default function TestimoniosReales({
  testimonials = MOCK_TESTIMONIALS,
  autoplay = true,
  autoplayInterval = 5000,
}: TestimoniosRealesProps) {
  const t = useTranslations('testimonials');
  const tCommon = useTranslations('common');
  const isEs = tCommon('language') === 'es';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: '-100px' });

  // Autoplay
  useEffect(() => {
    if (!autoplay || isPaused || !isInView) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [autoplay, autoplayInterval, isPaused, isInView, testimonials.length]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const goPrev = () => goTo((currentIndex - 1 + testimonials.length) % testimonials.length);
  const goNext = () => goTo((currentIndex + 1) % testimonials.length);

  return (
    <section
      ref={containerRef}
      className="relative py-20 md:py-32 overflow-hidden"
    >
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
            {isEs ? '⭐ Lo que dicen nuestros clientes' : '⭐ El que diuen els nostres clients'}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            {isEs ? 'Historias' : 'Històries'} <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{isEs ? 'reales' : 'reals'}</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {isEs
              ? 'No nos creas a nosotros. Escucha lo que dicen las personas que ya han vivido la experiencia Òrbita.'
              : 'No ens creguis a nosaltres. Escolta el que diuen les persones que ja han viscut l\'experiència Òrbita.'}
          </p>
        </motion.div>

        {/* Summary Stats */}
        <SummaryStats isEs={isEs} />

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation buttons */}
          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 z-10 w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <Icons.ChevronLeft />
          </button>
          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 z-10 w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <Icons.ChevronRight />
          </button>

          {/* Cards */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <TestimonialCard
                key={testimonials[currentIndex].id}
                testimonial={testimonials[currentIndex]}
                isActive={true}
                isEs={isEs}
              />
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-white/60 mb-4">
            {isEs ? '¿Quieres ser el próximo testimonio?' : 'Vols ser el pròxim testimoni?'}
          </p>
          <a
            href="/configurador"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-2xl transition-all hover:scale-105"
          >
            <span>{isEs ? 'Pide tu presupuesto' : 'Demana el teu pressupost'}</span>
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
