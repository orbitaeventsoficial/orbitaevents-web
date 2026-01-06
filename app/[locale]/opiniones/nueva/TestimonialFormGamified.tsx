'use client';

/**
 * FORMULARI D'OPINIONS GAMIFICAT
 * ==============================
 * Multi-step amb confetti, recompenses progressives,
 * upload de foto/vídeo i NPS score.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/app/config/site-config';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS I CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

interface FormData {
  // Verificació
  verificationCode: string;

  // Dades client (si no té codi)
  email: string;
  name: string;
  phone: string;
  city: string;
  instagram: string;

  // Opinió
  rating: number;
  npsScore: number;
  title: string;
  comment: string;
  eventType: string;
  eventDate: string;

  // Media
  photoUrl: string;
  videoUrl: string;

  // Consents
  allowGoogleShare: boolean;
  consentDataProcessing: boolean;
  consentMarketing: boolean;
  consentPhotoPublication: boolean;
}

interface VerifiedBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
}

interface SubmissionResult {
  discountCode: string;
  totalDiscount: number;
}

const STEP_IDS = ['start', 'rating', 'comment', 'media', 'nps', 'finish'] as const;

const EMOJIS = ['😢', '😐', '🙂', '😊', '🤩'];

const EVENT_TYPE_KEYS = ['boda', 'cumpleanos', 'corporativo', 'comunion', 'bautizo', 'fiesta', 'festival', 'otro'] as const;
const EVENT_EMOJIS: Record<string, string> = {
  boda: '💒',
  cumpleanos: '🎂',
  corporativo: '🏢',
  comunion: '⛪',
  bautizo: '👶',
  fiesta: '🎉',
  festival: '🎪',
  otro: '✨',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function TestimonialFormGamified() {
  const t = useTranslations('testimonialForm');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    verificationCode: '',
    email: '',
    name: '',
    phone: '',
    city: '',
    instagram: '',
    rating: 0,
    npsScore: -1,
    title: '',
    comment: '',
    eventType: '',
    eventDate: '',
    photoUrl: '',
    videoUrl: '',
    allowGoogleShare: false,
    consentDataProcessing: false,
    consentMarketing: false,
    consentPhotoPublication: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [verifiedBooking, setVerifiedBooking] = useState<VerifiedBooking | null>(null);
  const [hasVerificationCode, setHasVerificationCode] = useState<boolean | null>(null);

  // Media states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const parseJsonResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    return { success: false, error: text || 'Resposta no valida' };
  };

  // Calcular recompensa total
  const calculateReward = useCallback(() => {
    let total = 5; // Base
    if (formData.photoUrl) total += 5;
    if (formData.videoUrl) total += 10;
    if (formData.allowGoogleShare) total += 5;
    return total;
  }, [formData.photoUrl, formData.videoUrl, formData.allowGoogleShare]);

  // Verificar codi
  const verifyCode = async () => {
    try {
      const res = await fetch(`/api/bookings/verify?code=${formData.verificationCode}`);
      if (res.ok) {
        const booking = await res.json();
        setVerifiedBooking(booking);
        setFormData(prev => ({
          ...prev,
          name: booking.customerName || '',
          email: booking.customerEmail || '',
          eventType: booking.eventType || '',
          eventDate: booking.eventDate || '',
        }));
        setCurrentStep(1);
      } else {
        setUploadError(t('errors.codeInvalid'));
      }
    } catch {
      setUploadError(t('errors.verifyError'));
    }
  };

  // Continuar sense codi - mostrar formulari de dades (quedar al pas 0)
  const continueWithoutCode = () => {
    setHasVerificationCode(false);
    // NO canviem de step - el pas 0 mostrarà el formulari de dades
  };

  // Seleccionar rating amb confetti si és 5
  const selectRating = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
    if (rating === 5) {
      // Disparar confetti amb un petit delay per assegurar que el DOM està llest
      setTimeout(() => {
        try {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFB800', '#FF6B00', '#FFD700', '#FFA500', '#FFCC00'],
            disableForReducedMotion: true,
          });
          // Segona explosió per més efecte
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#FFB800', '#FF6B00'],
            });
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#FFD700', '#FFCC00'],
            });
          }, 150);
        } catch (error) {
          // Silenciar error de confetti en producción
          if (process.env.NODE_ENV === 'development') {
            console.log('Confetti error:', error);
          }
        }
      }, 100);
    }
  };

  // Upload foto via API (bypassa RLS)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('errors.photoMax'));
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload via API pública (sense autenticació)
    setPhotoUploading(true);
    setUploadError(null);

    try {
      const useSignedUrl = file.size > 4 * 1024 * 1024;
      const response = await fetch('/api/testimonial-upload', {
        method: 'POST',
        headers: useSignedUrl ? { 'Content-Type': 'application/json' } : undefined,
        body: useSignedUrl
          ? JSON.stringify({ fileName: file.name, fileType: file.type, type: 'photo' })
          : (() => {
              const formDataUpload = new FormData();
              formDataUpload.append('file', file);
              formDataUpload.append('type', 'photo');
              return formDataUpload;
            })(),
      });

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        if (result.useSignedUrl && result.signedUrl) {
          const uploadResponse = await fetch(result.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });

          if (!uploadResponse.ok) {
            throw new Error('Error pujant foto a storage');
          }

          setFormData(prev => ({ ...prev, photoUrl: result.url }));
          return;
        }

        throw new Error(result.error || 'Error pujant foto');
      }

      setFormData(prev => ({ ...prev, photoUrl: result.url }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadError(error instanceof Error ? error.message : t('errors.uploadPhotoError'));
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Upload vídeo via signed URL (per fitxers grans)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError(t('errors.videoMax'));
      return;
    }

    // Preview
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);

    setVideoUploading(true);
    setUploadError(null);

    try {
      // Per vídeos petits (<4MB), upload directe
      // Per vídeos grans, l'API retornarà signed URL
      const useSignedUrl = file.size > 4 * 1024 * 1024;
      const response = await fetch('/api/testimonial-upload', {
        method: 'POST',
        headers: useSignedUrl ? { 'Content-Type': 'application/json' } : undefined,
        body: useSignedUrl
          ? JSON.stringify({ fileName: file.name, fileType: file.type, type: 'video' })
          : (() => {
              const formDataUpload = new FormData();
              formDataUpload.append('file', file);
              formDataUpload.append('type', 'video');
              return formDataUpload;
            })(),
      });

      const result = await parseJsonResponse(response);

      if (!response.ok || !result.success) {
        // Si necessita signed URL per fitxers grans
        if (result.useSignedUrl && result.signedUrl) {
          // Pujar directament a Supabase amb el signed URL
          const uploadResponse = await fetch(result.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });

          if (!uploadResponse.ok) {
            throw new Error('Error pujant vídeo a storage');
          }

          setFormData(prev => ({ ...prev, videoUrl: result.url }));
        } else {
          throw new Error(result.error || 'Error pujant vídeo');
        }
      } else {
        setFormData(prev => ({ ...prev, videoUrl: result.url }));
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadError(error instanceof Error ? error.message : t('errors.uploadVideoError'));
      setVideoPreview(null);
    } finally {
      setVideoUploading(false);
    }
  };

  // Submit
  const handleSubmit = async () => {
    // Validar camps obligatoris
    if (!formData.name || formData.name.length < 2) {
      setUploadError(t('validation.nameRequired'));
      return;
    }
    if (!formData.email) {
      setUploadError(t('validation.emailRequired'));
      return;
    }
    if (!formData.rating || formData.rating < 1) {
      setUploadError(t('validation.ratingRequired'));
      return;
    }
    if (!formData.comment || formData.comment.length < 10) {
      setUploadError(t('validation.commentRequired'));
      return;
    }
    if (!formData.consentDataProcessing) {
      setUploadError(t('validation.acceptData'));
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const totalDiscount = calculateReward();

      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalDiscount,
          verifiedBookingId: verifiedBooking?.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || t('errors.submitError'));
      }
      const result = await res.json();
      setSubmitResult({
        discountCode: result.data?.discountCode || 'ORBITA-THANKS',
        totalDiscount,
      });

      // Confetti final!
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFB800', '#FF6B00', '#FFD700', '#00FF00'],
      });

      setCurrentStep(5); // Finish step
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('errors.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER STEPS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderStep = () => {
    switch (STEP_IDS[currentStep]) {
      // STEP 0: START - Verificació o dades
      case 'start':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {hasVerificationCode === null ? (
              // Preguntar si té codi
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {t('gamified.hasCode.question')}
                  </h2>
                  <p className="text-white/60">
                    {t('gamified.hasCode.subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setHasVerificationCode(true)}
                    className="p-6 bg-amber-400/10 border-2 border-amber-400/30 rounded-2xl hover:bg-amber-400/20 hover:border-amber-400/50 transition-all"
                  >
                    <span className="text-4xl block mb-3">🎫</span>
                    <span className="text-white font-medium">{t('gamified.hasCode.yesCode')}</span>
                  </button>

                  <button
                    onClick={continueWithoutCode}
                    className="p-6 bg-white/5 border-2 border-white/20 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <span className="text-4xl block mb-3">✍️</span>
                    <span className="text-white font-medium">{t('gamified.hasCode.noCode')}</span>
                  </button>
                </div>
              </>
            ) : hasVerificationCode ? (
              // Input codi
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {t('gamified.enterCode.title')}
                  </h2>
                  <p className="text-white/60">
                    {t('gamified.enterCode.subtitle')}
                  </p>
                </div>

                <input
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    verificationCode: e.target.value.toUpperCase()
                  }))}
                  placeholder={t('gamified.enterCode.placeholder')}
                  className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-2xl text-white text-center text-xl tracking-wider placeholder-white/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />

                <button
                  onClick={verifyCode}
                  disabled={formData.verificationCode.length < 5}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  {t('gamified.enterCode.verify')}
                </button>

                <button
                  onClick={continueWithoutCode}
                  className="w-full py-3 text-white/60 hover:text-white transition-colors"
                >
                  {t('gamified.enterCode.continueWithout')}
                </button>
              </>
            ) : (
              // Formulari dades bàsiques
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {t('gamified.yourData.title')}
                  </h2>
                  <p className="text-white/60">
                    {t('gamified.yourData.subtitle')}
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email *"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-amber-400 transition-all"
                  />

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`${t('form.name')} *`}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-amber-400 transition-all"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder={t('form.phoneOptional')}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-amber-400 transition-all"
                    />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={t('form.cityOptional')}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-amber-400 transition-all"
                    />
                  </div>

                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-amber-400 transition-all"
                  >
                    <option value="">{t('form.selectType')}</option>
                    {EVENT_TYPE_KEYS.map(key => (
                      <option key={key} value={key}>{EVENT_EMOJIS[key]} {t(`eventTypes.${key}`)}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={!formData.email || !formData.name || formData.name.length < 2}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  {t('gamified.yourData.continue')}
                </button>
              </>
            )}
          </motion.div>
        );

      // STEP 1: RATING
      case 'rating':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('gamified.rating.title')}
              </h2>
              <p className="text-white/60">{t('gamified.rating.subtitle')}</p>
            </div>

            <div className="flex justify-center gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button
                  key={rating}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => selectRating(rating)}
                  className={`text-4xl sm:text-5xl p-3 sm:p-4 rounded-2xl transition-all ${
                    formData.rating === rating
                      ? 'bg-amber-400/20 ring-2 ring-amber-400 scale-110'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {EMOJIS[rating - 1]}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {formData.rating > 0 && (
                <motion.p
                  key={formData.rating}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center text-xl text-amber-400"
                >
                  {t(`gamified.emojiMessages.${formData.rating}`)}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );

      // STEP 2: COMMENT
      case 'comment':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('gamified.comment.title')}
              </h2>
              <p className="text-white/60">{t('gamified.comment.subtitle')}</p>
            </div>

            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('gamified.comment.titlePlaceholder')}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-amber-400 transition-all"
            />

            <div className="relative">
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder={t('gamified.comment.commentPlaceholder')}
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-amber-400 transition-all resize-none"
              />
              <span className={`absolute bottom-3 right-3 text-sm ${
                formData.comment.length > 1000 ? 'text-red-400' : 'text-white/40'
              }`}>
                {formData.comment.length}/1000
              </span>
            </div>
          </motion.div>
        );

      // STEP 3: MEDIA
      case 'media':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('gamified.media.title')}
              </h2>
              <p className="text-white/60">
                {t('gamified.media.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Foto */}
              <div className="relative">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-green-500">
                    <Image
                      src={photoPreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    {photoUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                      </div>
                    )}
                    {!photoUploading && (
                      <>
                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <button
                          onClick={() => {
                            setPhotoPreview(null);
                            setFormData(prev => ({ ...prev, photoUrl: '' }));
                          }}
                          className="absolute bottom-2 right-2 px-3 py-1 bg-red-500/80 text-white text-sm rounded-lg"
                        >
                          {t('gamified.media.delete')}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl hover:border-amber-400/50 hover:bg-amber-400/5 transition-all"
                  >
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-white/60 text-sm">{t('gamified.media.addPhoto')}</span>
                    <span className="text-amber-400 text-xs mt-1">{t('gamified.media.photoDiscount')}</span>
                  </button>
                )}
              </div>

              {/* Vídeo */}
              <div className="relative">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />

                {videoPreview ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-purple-500">
                    <video
                      src={videoPreview}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    {videoUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                      </div>
                    )}
                    {!videoUploading && (
                      <>
                        <div className="absolute top-2 right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <button
                          onClick={() => {
                            setVideoPreview(null);
                            setFormData(prev => ({ ...prev, videoUrl: '' }));
                          }}
                          className="absolute bottom-2 right-2 px-3 py-1 bg-red-500/80 text-white text-sm rounded-lg"
                        >
                          {t('gamified.media.delete')}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl hover:border-purple-400/50 hover:bg-purple-400/5 transition-all"
                  >
                    <span className="text-4xl mb-2">🎬</span>
                    <span className="text-white/60 text-sm">{t('gamified.media.addVideo')}</span>
                    <span className="text-purple-400 text-xs mt-1">{t('gamified.media.videoDiscount')}</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-center text-white/40 text-sm">
              {t('gamified.media.maxSizes')}
            </p>
          </motion.div>
        );

      // STEP 4: NPS
      case 'nps':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('gamified.nps.title')}
              </h2>
              <p className="text-white/60">{t('gamified.nps.question')}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <motion.button
                  key={score}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFormData(prev => ({ ...prev, npsScore: score }))}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-bold text-sm sm:text-base transition-all ${
                    formData.npsScore === score
                      ? score >= 9 ? 'bg-green-500 text-white'
                        : score >= 7 ? 'bg-yellow-500 text-black'
                        : 'bg-red-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {score}
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between text-xs sm:text-sm px-2">
              <span className={`transition-colors ${
                formData.npsScore >= 0 && formData.npsScore <= 6
                  ? 'text-red-400 font-semibold'
                  : 'text-white/40'
              }`}>
                {t('gamified.nps.unlikely')}
              </span>
              <span className={`transition-colors ${
                formData.npsScore >= 9
                  ? 'text-green-400 font-semibold'
                  : formData.npsScore >= 7
                    ? 'text-yellow-400 font-semibold'
                    : 'text-white/40'
              }`}>
                {t('gamified.nps.likely')}
              </span>
            </div>

            {/* Google Review CTA */}
            <motion.label
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all"
            >
              <input
                type="checkbox"
                checked={formData.allowGoogleShare}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  allowGoogleShare: e.target.checked
                }))}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-400"
              />
              <div>
                <p className="text-white font-medium">{t('gamified.nps.googleShare')}</p>
                <p className="text-amber-400 text-sm">{t('gamified.nps.googleDiscount')}</p>
              </div>
            </motion.label>

            {/* Consents */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentDataProcessing}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consentDataProcessing: e.target.checked
                  }))}
                  className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-amber-500"
                />
                <span className="text-white/60 text-sm">
                  {t('gamified.consent.dataProcessing')}{' '}
                  <a href="/legal/privacidad" className="text-amber-400 underline" target="_blank" rel="noopener noreferrer">
                    {t('form.privacyPolicy')}
                  </a>{' '}
                  <span className="text-red-400">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentPhotoPublication}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consentPhotoPublication: e.target.checked
                  }))}
                  className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-amber-500"
                />
                <span className="text-white/60 text-sm">
                  {t('gamified.consent.showName')}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentMarketing}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consentMarketing: e.target.checked
                  }))}
                  className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-amber-500"
                />
                <span className="text-white/60 text-sm">
                  {t('gamified.consent.receiveOffers')}
                </span>
              </label>
            </div>
          </motion.div>
        );

      // STEP 5: FINISH
      case 'finish':
        if (!submitResult) return null;

        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-8xl"
            >
              🎉
            </motion.div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t('success.thanksTitle')}</h1>
              <p className="text-white/60">{t('success.thanksSubtitle')}</p>
            </div>

            <div className="p-6 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-2xl border border-amber-400/30">
              <p className="text-amber-400 text-sm mb-2">{t('success.yourDiscount')}</p>
              <p className="text-5xl font-black text-amber-400">{submitResult.totalDiscount}%</p>
              <p className="text-2xl font-bold text-white mt-2 tracking-widest">
                {submitResult.discountCode}
              </p>
              <p className="text-white/60 text-sm mt-2">
                {t('success.codeByEmail')}
              </p>
            </div>

            {formData.allowGoogleShare && SITE_CONFIG.reviews.googleBusinessUrl && (
              <a
                href={SITE_CONFIG.reviews.googleBusinessUrl}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all"
              >
                ⭐ {t('success.leaveGoogleReview')}
              </a>
            )}

            <a
              href="/"
              className="block text-white/60 hover:text-amber-400 transition-colors"
            >
              ← {t('success.backHome')}
            </a>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-lg mx-auto">
        {/* Progress bar */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEP_IDS.slice(1, -1).map((stepId, i) => (
                <div
                  key={stepId}
                  className={`text-xs ${i < currentStep ? 'text-amber-400' : 'text-white/30'}`}
                >
                  {t(`gamified.steps.${stepId}`)}
                </div>
              ))}
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                animate={{ width: `${(currentStep / (STEP_IDS.length - 2)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
            >
              <p className="text-red-400 text-sm">{uploadError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{t('gamified.navigation.previous')}</span>
            </button>

            <div className="flex-1" />

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={
                  (currentStep === 1 && formData.rating === 0) ||
                  (currentStep === 2 && formData.comment.length < 10)
                }
                className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-amber-400 text-black font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-300 transition-all"
              >
                <span>{t('gamified.navigation.next')}</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.consentDataProcessing || formData.npsScore === -1}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                    <span>{t('gamified.navigation.submitting')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('gamified.navigation.submit')}</span>
                    <span>🎁</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Reward indicator */}
        {currentStep > 0 && currentStep < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-amber-400/10 to-purple-500/10 rounded-xl border border-amber-400/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <span className="text-white/80 text-sm sm:text-base">{t('gamified.navigation.currentReward')}</span>
            </div>
            <span className="text-2xl font-bold text-amber-400">{calculateReward()}%</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
