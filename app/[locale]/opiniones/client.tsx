// app/[locale]/opiniones/client.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
  source: 'google' | 'database' | 'json';
}

interface WebTestimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  photoUrl?: string;
  eventType?: string;
  createdAt: string;
}

type UiLocale = 'ca' | 'es' | 'en';

const UI_COPY: Record<UiLocale, {
  verifiedBadge: string;
  heroBadge: string;
  heroTitlePrefix: string;
  heroTitleAccent: string;
  ratingWord: string;
  reviewsWord: string;
  introWithCount: (count: number) => string;
  introNoCount: string;
  knownTitle: string;
  knownDescription: string;
  knownButton: string;
  webOpinionsTitle: string;
  webOpinionsSubtitle: string;
  googleTitle: string;
  googleSubtitle: string;
  googleCta: string;
  emptyState: string;
  finalTitlePrefix: string;
  finalTitleAccent: string;
  finalWithCount: (count: number) => string;
  finalNoCount: string;
  configureEvent: string;
  contact: string;
}> = {
  ca: {
    verifiedBadge: 'Verificat',
    heroBadge: '⭐ Ressenyes verificades',
    heroTitlePrefix: 'El que diuen',
    heroTitleAccent: 'els nostres clients',
    ratingWord: 'valoració',
    reviewsWord: 'ressenyes',
    introWithCount: (count) => `Més de ${count} famílies i empreses han confiat en nosaltres. Llegeix les seves experiències i, si ja ens coneixes, deixa la teva.`,
    introNoCount: 'Famílies i empreses han confiat en nosaltres. Llegeix les seves experiències i, si ja ens coneixes, deixa la teva.',
    knownTitle: 'Ja ens coneixes?',
    knownDescription: 'Deixa la teva valoració i obtén fins a un 25% de descompte per al teu pròxim esdeveniment',
    knownButton: 'Deixa la meva opinió i obtén descompte',
    webOpinionsTitle: 'Opinions del nostre web',
    webOpinionsSubtitle: 'Testimonis verificats de clients',
    googleTitle: 'Ressenyes de Google',
    googleSubtitle: 'Opinions verificades de Google Business',
    googleCta: 'Veure-les totes a Google',
    emptyState: 'Encara no hi ha ressenyes disponibles. Sigues la primera persona a deixar la teva opinió.',
    finalTitlePrefix: 'Vols viure una experiència',
    finalTitleAccent: 'inoblidable',
    finalWithCount: (count) => `Uneix-te a les més de ${count} famílies que han confiat en nosaltres`,
    finalNoCount: 'Uneix-te a les famílies que han confiat en nosaltres',
    configureEvent: 'Configura el teu esdeveniment',
    contact: 'Contacta',
  },
  es: {
    verifiedBadge: 'Verificado',
    heroBadge: '⭐ Reseñas verificadas',
    heroTitlePrefix: 'Lo que dicen',
    heroTitleAccent: 'nuestros clientes',
    ratingWord: 'valoración',
    reviewsWord: 'reseñas',
    introWithCount: (count) => `Más de ${count} familias y empresas han confiado en nosotros. Lee sus experiencias y, si ya nos conoces, deja la tuya.`,
    introNoCount: 'Familias y empresas han confiado en nosotros. Lee sus experiencias y, si ya nos conoces, deja la tuya.',
    knownTitle: '¿Ya nos conoces?',
    knownDescription: 'Deja tu valoración y obtén hasta un 25% de descuento para tu próximo evento',
    knownButton: 'Dejar mi opinión y obtener descuento',
    webOpinionsTitle: 'Opiniones de nuestra web',
    webOpinionsSubtitle: 'Testimonios verificados de clientes',
    googleTitle: 'Reseñas de Google',
    googleSubtitle: 'Opiniones verificadas de Google Business',
    googleCta: 'Ver todas en Google',
    emptyState: 'Aún no hay reseñas disponibles. ¡Sé el primero en dejar tu opinión!',
    finalTitlePrefix: '¿Quieres vivir una experiencia',
    finalTitleAccent: 'inolvidable',
    finalWithCount: (count) => `Únete a las más de ${count} familias que han confiado en nosotros`,
    finalNoCount: 'Únete a las familias que han confiado en nosotros',
    configureEvent: 'Configura tu evento',
    contact: 'Contactar',
  },
  en: {
    verifiedBadge: 'Verified',
    heroBadge: '⭐ Verified reviews',
    heroTitlePrefix: 'What',
    heroTitleAccent: 'our clients say',
    ratingWord: 'rating',
    reviewsWord: 'reviews',
    introWithCount: (count) => `Over ${count} families and companies have trusted us. Read their experiences and, if you already know us, share yours.`,
    introNoCount: 'Families and companies have trusted us. Read their experiences and, if you already know us, share yours.',
    knownTitle: 'Already worked with us?',
    knownDescription: 'Leave your review and get up to 25% off your next event',
    knownButton: 'Leave my review and get a discount',
    webOpinionsTitle: 'Reviews from our website',
    webOpinionsSubtitle: 'Verified customer testimonials',
    googleTitle: 'Google reviews',
    googleSubtitle: 'Verified reviews from Google Business',
    googleCta: 'View all on Google',
    emptyState: 'No reviews are available yet. Be the first to share your experience.',
    finalTitlePrefix: 'Want to live an',
    finalTitleAccent: 'unforgettable experience',
    finalWithCount: (count) => `Join the ${count}+ families that have trusted us`,
    finalNoCount: 'Join the families that have trusted us',
    configureEvent: 'Build your event',
    contact: 'Contact',
  },
};

interface FormData {
  rating: number;
  comment: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  videoUrl: string;
  allowGoogleShare: boolean;
  consentPhotoPublication: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Star: ({ filled, size = 20 }: { filled: boolean; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Google: () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  Quote: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.1">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

function RatingStars({ rating, size = 20, interactive = false, onChange }: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          disabled={!interactive}
        >
          <Icons.Star filled={star <= rating} size={size} />
        </button>
      ))}
    </div>
  );
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-colors"
    >
      <div className="absolute top-4 right-4 opacity-10">
        <Icons.Quote />
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0">
          {review.profile_photo_url ? (
            <Image
              src={review.profile_photo_url}
              alt={review.author_name}
              fill
              sizes="48px"
              quality={60}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
              {review.author_name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{review.author_name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} size={14} />
            <span className="text-white/50 text-sm">{review.relative_time_description}</span>
          </div>
        </div>

        {review.source === 'google' || review.source === 'json' ? (
          <Icons.Google />
        ) : null}
      </div>

      <p className="text-white/80 text-sm leading-relaxed line-clamp-4">
        "{review.text}"
      </p>
    </motion.div>
  );
}

function WebTestimonialCard({
  testimonial,
  verifiedLabel,
}: {
  testimonial: WebTestimonial;
  verifiedLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 ring-2 ring-amber-500/30">
          {testimonial.photoUrl ? (
            <Image
              src={testimonial.photoUrl}
              alt={testimonial.name}
              fill
              sizes="48px"
              quality={60}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
              {testimonial.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{testimonial.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={testimonial.rating} size={14} />
            {testimonial.eventType && (
              <span className="text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded-full">
                {testimonial.eventType}
              </span>
            )}
          </div>
        </div>

          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
          {verifiedLabel}
          </span>
        </div>

      <p className="text-white/90 leading-relaxed">
        "{testimonial.text}"
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMULARIO
// ═══════════════════════════════════════════════════════════════════════════

function TestimonialForm({ onSuccess }: { onSuccess: (code: string, percent: number) => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    rating: 0,
    comment: '',
    name: '',
    email: '',
    phone: '',
    photoUrl: '',
    videoUrl: '',
    allowGoogleShare: false,
    consentPhotoPublication: false,
  });

  const discountPercent = 5 + (form.photoUrl ? 5 : 0) + (form.videoUrl ? 10 : 0) + (form.allowGoogleShare ? 5 : 0);

  function updateForm<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar');
      }

      onSuccess(data.discountCode, data.discountPercent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  const canContinue = () => {
    switch (step) {
      case 0: return form.rating > 0;
      case 1: return form.comment.length >= 10;
      case 2: return true;
      case 3: return form.name.length >= 2 && form.email.includes('@');
      default: return false;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
      {/* Progress */}
      <div className="flex justify-between mb-8">
        {['Valoración', 'Comentario', 'Extras', 'Datos'].map((label, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-amber-500 text-black' :
              'bg-white/10 text-white/50'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-2 ${i === step ? 'text-amber-400' : 'text-white/50'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Discount Preview */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 text-center">
        <p className="text-white/60 text-sm">Tu descuento actual</p>
        <p className="text-4xl font-bold text-amber-400">{discountPercent}%</p>
        <p className="text-xs text-white/50 mt-1">
          {form.photoUrl ? '✓' : '📸 +5%'} · {form.videoUrl ? '✓' : '🎬 +10%'} · {form.allowGoogleShare ? '✓' : '⭐ +5% Google'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Rating */}
        {step === 0 && (
          <motion.div
            key="rating"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h3 className="text-2xl font-semibold text-white mb-8">¿Cómo valorarías tu experiencia?</h3>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateForm('rating', star)}
                  className={`text-5xl transition-all hover:scale-110 ${
                    star <= form.rating ? 'text-amber-400' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {form.rating > 0 && (
              <p className="text-white/70">
                {form.rating === 5 && '🎉 ¡Increíble! ¡Nos alegra mucho!'}
                {form.rating === 4 && '😊 ¡Muy bien! Gracias por tu feedback'}
                {form.rating === 3 && '👍 Gracias. ¿Cómo podemos mejorar?'}
                {form.rating <= 2 && '😔 Lo sentimos. Cuéntanos más.'}
              </p>
            )}
          </motion.div>
        )}

        {/* Step 1: Comment */}
        {step === 1 && (
          <motion.div
            key="comment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Cuéntanos tu experiencia</h3>
            <textarea
              value={form.comment}
              onChange={(e) => updateForm('comment', e.target.value)}
              rows={5}
              className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              placeholder="¿Qué es lo que más te gustó? ¿Cómo fue el ambiente? ¿Recomendarías Òrbita Events?"
            />
            <p className={`text-sm text-right mt-2 ${form.comment.length >= 10 ? 'text-green-400' : 'text-white/50'}`}>
              {form.comment.length} / mínimo 10 caracteres
            </p>
          </motion.div>
        )}

        {/* Step 2: Media */}
        {step === 2 && (
          <motion.div
            key="media"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Extras opcionales</h3>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-medium text-amber-400 mb-2">
                📸 Enlace a foto (+5% descuento)
              </label>
              <input
                type="url"
                value={form.photoUrl}
                onChange={(e) => updateForm('photoUrl', e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-amber-500"
                placeholder="https://drive.google.com/... o Instagram"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-medium text-amber-400 mb-2">
                🎬 Enlace a vídeo (+10% descuento)
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => updateForm('videoUrl', e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-amber-500"
                placeholder="https://youtube.com/... o TikTok"
              />
            </div>

            <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors">
              <input
                type="checkbox"
                checked={form.allowGoogleShare}
                onChange={(e) => updateForm('allowGoogleShare', e.target.checked)}
                className="w-5 h-5 rounded border-white/30 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-medium text-white">Compartir en Google Reviews (+5%)</span>
                <p className="text-sm text-white/50">Te enviaremos un enlace directo</p>
              </div>
            </label>

            <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consentPhotoPublication}
                onChange={(e) => updateForm('consentPhotoPublication', e.target.checked)}
                className="w-5 h-5 rounded border-white/30 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-medium text-white">Permitir publicación</span>
                <p className="text-sm text-white/50">Podemos usar tu foto/vídeo en redes</p>
              </div>
            </label>
          </motion.div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">¿Dónde te enviamos el descuento?</h3>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:border-amber-500"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:border-amber-500"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Teléfono (opcional)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:border-amber-500"
                placeholder="+34 600 000 000"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className={`px-6 py-3 rounded-full font-medium transition-all ${
            step === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          ← Anterior
        </button>

        <button
          type="button"
          onClick={() => step === 3 ? handleSubmit() : setStep(step + 1)}
          disabled={!canContinue() || loading}
          className={`px-8 py-3 rounded-full font-bold transition-all ${
            canContinue() && !loading
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </span>
          ) : step === 3 ? (
            '✓ Enviar y recibir descuento'
          ) : (
            'Siguiente →'
          )}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS STATE
// ═══════════════════════════════════════════════════════════════════════════

function SuccessState({ discountCode, discountPercent }: { discountCode: string; discountPercent: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-sm border border-amber-500/30 rounded-3xl p-8 text-center"
    >
      <div className="text-8xl mb-6">🎉</div>

      <h2 className="text-3xl font-bold text-amber-400 mb-4">¡Gracias por tu valoración!</h2>

      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-2 border-amber-500 rounded-2xl p-8 mb-6">
        <p className="text-white/60 mb-2">Tu código de descuento exclusivo</p>
        <p className="text-5xl font-bold text-amber-400 tracking-widest mb-4">{discountCode}</p>
        <p className="text-3xl font-bold text-white">{discountPercent}% DESCUENTO</p>
        <p className="text-sm text-white/50 mt-4">Válido durante 6 meses para tu próximo evento</p>
      </div>

      <p className="text-white/60 mb-6">
        Te hemos enviado un email con tu código y una imagen para compartir.
      </p>

      <Link
        href="/"
        className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold px-8 py-4 rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
      >
        Volver al inicio
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function OpinionesClient() {
  const locale = useLocale();
  const lang: UiLocale = locale.startsWith('ca') ? 'ca' : locale.startsWith('en') ? 'en' : 'es';
  const t = UI_COPY[lang];
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [webTestimonials, setWebTestimonials] = useState<WebTestimonial[]>([]);
  const [averageRating, setAverageRating] = useState(5);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState<{ code: string; percent: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        let googleCount = 0;
        let googleSource: string | null = null;
        let webCount = 0;
        let hasGoogleReviews = false;
        let hasGoogleRating = false;
        // Load Google reviews
        const googleRes = await fetch('/api/google-reviews');
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          const parsedGoogleReviews = googleData.reviews || [];
          setGoogleReviews(parsedGoogleReviews);
          setAverageRating(googleData.rating || 5);
          hasGoogleReviews = parsedGoogleReviews.length > 0;
          hasGoogleRating = typeof googleData.rating === 'number';
          googleCount = googleData.user_ratings_total || 0;
          googleSource = googleData.source || null;
        }

        const statsRes = await fetch('/api/public/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          googleCount = Math.max(googleCount, statsData?.googleReviewsCount || 0);
          if (!hasGoogleReviews && !hasGoogleRating && typeof statsData?.averageRating === 'number') {
            setAverageRating(statsData.averageRating);
          }
        }

        // Load web testimonials
        const testimonialsRes = await fetch('/api/testimonials?limit=20');
        if (testimonialsRes.ok) {
          const testimonialsData = await testimonialsRes.json();
          setWebTestimonials(testimonialsData.testimonials || []);
          webCount = (testimonialsData.testimonials || []).length;
        }

        if (!googleSource) {
          setTotalReviews(webCount);
        } else if (googleSource === 'google' || googleSource === 'json') {
          setTotalReviews(googleCount + webCount);
        } else {
          setTotalReviews(googleCount);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSuccess = (code: string, percent: number) => {
    setSuccess({ code, percent });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold mb-6">
              {t.heroBadge}
            </span>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              {t.heroTitlePrefix}{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {t.heroTitleAccent}
              </span>
            </h1>

            <div className="flex items-center justify-center gap-4 mb-8">
              <RatingStars rating={5} size={28} />
              <span className="text-white text-3xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-white/60 text-lg">
                · {totalReviews > 0 ? `${totalReviews}+ ${t.reviewsWord}` : t.reviewsWord}
              </span>
            </div>

            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {totalReviews > 0 ? t.introWithCount(totalReviews) : t.introNoCount}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA to leave review */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 md:p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">{t.knownTitle}</h2>
            <p className="text-white/70 mb-6">
              {t.knownDescription.split('25%')[0]}
              <span className="text-amber-400 font-bold">25%</span>
              {t.knownDescription.split('25%')[1] || ''}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              {t.knownButton}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && !success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-xl w-full my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
              <TestimonialForm onSuccess={handleSuccess} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-lg w-full"
            >
              <SuccessState discountCode={success.code} discountPercent={success.percent} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Web Testimonials */}
      {webTestimonials.length > 0 && (
        <section className="py-16 border-t border-white/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-2">{t.webOpinionsTitle}</h2>
              <p className="text-white/60">{t.webOpinionsSubtitle}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {webTestimonials.map((testimonial) => (
                <WebTestimonialCard key={testimonial.id} testimonial={testimonial} verifiedLabel={t.verifiedBadge} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Google Reviews */}
      {googleReviews.length > 0 && (
        <section className="py-16 border-t border-white/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Icons.Google />
                <h2 className="text-2xl font-bold text-white">{t.googleTitle}</h2>
              </div>
              <p className="text-white/60">{t.googleSubtitle}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {googleReviews.slice(0, 9).map((review, index) => (
                <GoogleReviewCard key={index} review={review} />
              ))}
            </div>

            <div className="text-center mt-8">
              <a
                href="https://g.page/r/CXcgbvANsXSzEBE/review"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-colors"
              >
                <Icons.Google />
                  <span>{t.googleCta}</span>
                </a>
              </div>
            </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && googleReviews.length === 0 && webTestimonials.length === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white/60 text-lg">
              {t.emptyState}
            </p>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t.finalTitlePrefix}{' '}
              <span className="text-amber-400">{t.finalTitleAccent}</span>?
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              {totalReviews > 0 ? t.finalWithCount(totalReviews) : t.finalNoCount}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/configurador"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                {t.configureEvent}
              </Link>
              <Link
                href="/contacto"
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all"
              >
                {t.contact}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
