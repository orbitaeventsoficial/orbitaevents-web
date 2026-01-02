'use client';

/**
 * FORMULARI D'OPINIONS - Estil Púrpura/Fucsia
 * ============================================
 * Formulari públic per enviar opinions amb:
 * - Rating amb estrelles animades
 * - Upload de foto a Supabase Storage
 * - Camps opcionals i obligatoris
 * - RGPD compliance
 * - Animacions Framer Motion
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Esquema de validació actualitzat per nou esquema Supabase
const testimonialSchema = z.object({
  email: z.string().email('Email no vàlid'),
  name: z.string().min(2, 'El nom ha de tenir mínim 2 caràcters'),
  phone: z.string().optional(),
  city: z.string().optional(),
  instagram: z.string().optional(),
  title: z.string().max(200, 'El títol ha de tenir màxim 200 caràcters').optional(),
  comment: z
    .string()
    .min(10, 'El comentari ha de tenir mínim 10 caràcters')
    .max(1000, 'El comentari ha de tenir màxim 1000 caràcters'),
  rating: z.number().min(1).max(5),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
  photoUrl: z.string().optional(),
  consentPhotoPublication: z.boolean().default(false),
  consentDataProcessing: z.boolean().refine(val => val === true, {
    message: "Has d'acceptar el tractament de dades",
  }),
  consentMarketing: z.boolean().optional(),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

const EVENT_TYPE_KEYS = ['boda', 'cumpleanos', 'corporativo', 'comunion', 'bautizo', 'fiesta', 'festival', 'otro'] as const;

interface SubmissionResult {
  discountCode: string;
  discountPercent: number;
}

export default function TestimonialForm() {
  const t = useTranslations('testimonialForm');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      city: '',
      instagram: '',
      title: '',
      comment: '',
      rating: 5,
      eventType: '',
      eventDate: '',
      photoUrl: '',
      consentPhotoPublication: false,
      consentDataProcessing: false,
      consentMarketing: false,
    },
  });

  const rating = watch('rating');
  const comment = watch('comment') || '';

  // Handler per upload de foto
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipus
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setSubmitError(t('errors.fileType'));
      return;
    }

    // Validar mida (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError(t('errors.fileTooLarge'));
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Pujar a Supabase
    setPhotoUploading(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('errors.uploadError'));
      }

      setValue('photoUrl', result.url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.uploadError');
      setSubmitError(errorMessage);
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setValue('photoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: TestimonialFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('errors.submitError'));
      }

      setSubmitResult({
        discountCode: result.data.discountCode,
        discountPercent: result.data.discountPercent || 10,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.submitError');
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla d'èxit
  if (submitResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="relative bg-gradient-to-br from-zinc-900 via-purple-950/20 to-zinc-900 rounded-3xl p-8 md:p-12 border border-purple-500/30 overflow-hidden">
          {/* Efecte glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Icona èxit */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-center mb-4"
            >
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                {t('success.title')}
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-center mb-8 text-lg"
            >
              {t('success.subtitle')}
            </motion.p>

            {/* Codi de descompte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative bg-black/50 backdrop-blur-sm border-2 border-purple-500 rounded-2xl p-8 mb-8 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10" />
              <div className="relative z-10">
                <p className="text-purple-400 text-sm font-medium mb-2 uppercase tracking-wider">
                  {t('success.exclusiveCode')}
                </p>
                <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent tracking-widest mb-3">
                  {submitResult.discountCode}
                </p>
                <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full">
                  <span className="text-2xl font-bold text-white">{submitResult.discountPercent}%</span>
                  <span className="text-purple-300">{t('success.discount')}</span>
                </div>
                <p className="text-gray-500 text-sm mt-4">{t('success.validFor')}</p>
              </div>
            </motion.div>

            {/* Botó copiar */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => {
                navigator.clipboard.writeText(submitResult.discountCode);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {t('success.copyCode')}
            </motion.button>

            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              href="/"
              className="block text-center text-gray-500 hover:text-purple-400 mt-6 transition-colors"
            >
              ← {t('success.backHome')}
            </motion.a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative bg-gradient-to-br from-zinc-900 via-purple-950/10 to-zinc-900 rounded-3xl p-6 md:p-10 border border-zinc-800 overflow-hidden"
      >
        {/* Efecte glow subtil */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Error global */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6"
              >
                <p className="text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {submitError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RATING - Estrelles */}
          <fieldset className="mb-10 text-center">
            <legend className="block text-white font-semibold mb-4 text-lg">
              {t('form.ratingQuestion')}
            </legend>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <motion.button
                  key={star}
                  type="button"
                  onClick={() => setValue('rating', star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-5xl transition-all duration-200 focus:outline-none"
                >
                  <span
                    className={`${
                      star <= (hoveredStar || rating)
                        ? 'text-transparent bg-gradient-to-br from-purple-400 to-fuchsia-500 bg-clip-text drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                        : 'text-zinc-700 hover:text-zinc-500'
                    }`}
                  >
                    ★
                  </span>
                </motion.button>
              ))}
            </div>
            <p className="text-purple-400 mt-2 text-sm">
              {rating >= 1 && rating <= 5 && t(`form.ratingLabels.${rating}`)}
            </p>
          </fieldset>

          {/* EMAIL - Obligatori */}
          <div className="mb-6">
            <label htmlFor="testimonial-email" className="block text-sm text-gray-400 mb-2">
              Email <span className="text-fuchsia-500">*</span>
            </label>
            <input
              id="testimonial-email"
              type="email"
              {...register('email')}
              className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              placeholder="el-teu@email.com"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1.5">{errors.email.message}</p>}
          </div>

          {/* CAMPS OPCIONALS - Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="testimonial-name" className="block text-sm text-gray-400 mb-2">
                {t('form.name')} <span className="text-fuchsia-500">*</span>
              </label>
              <input
                id="testimonial-name"
                type="text"
                {...register('name')}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="testimonial-phone" className="block text-sm text-gray-400 mb-2">{t('form.phoneOptional')}</label>
              <input
                id="testimonial-phone"
                type="tel"
                {...register('phone')}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="+34 612 345 678"
              />
            </div>

            <div>
              <label htmlFor="testimonial-city" className="block text-sm text-gray-400 mb-2">{t('form.cityOptional')}</label>
              <input
                id="testimonial-city"
                type="text"
                {...register('city')}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>

            <div>
              <label htmlFor="testimonial-instagram" className="block text-sm text-gray-400 mb-2">{t('form.instagramOptional')}</label>
              <input
                id="testimonial-instagram"
                type="text"
                {...register('instagram')}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="@username"
              />
            </div>
          </div>

          {/* TIPUS D'EVENT I DATA */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="testimonial-eventType" className="block text-sm text-gray-400 mb-2">{t('form.eventType')}</label>
              <select
                id="testimonial-eventType"
                {...register('eventType')}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.5rem',
                }}
              >
                <option value="">{t('form.selectType')}</option>
                {EVENT_TYPE_KEYS.map(key => (
                  <option key={key} value={key}>
                    {t(`eventTypes.${key}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="testimonial-eventDate" className="block text-sm text-gray-400 mb-2">{t('form.eventDate')}</label>
              <input
                id="testimonial-eventDate"
                type="date"
                {...register('eventDate')}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* TÍTOL (opcional) */}
          <div className="mb-6">
            <label htmlFor="testimonial-title" className="block text-sm text-gray-400 mb-2">{t('form.titleOptional')}</label>
            <input
              id="testimonial-title"
              type="text"
              {...register('title')}
              className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              placeholder={t('form.titlePlaceholder')}
            />
          </div>

          {/* COMENTARI */}
          <div className="mb-6">
            <label htmlFor="testimonial-comment" className="block text-sm text-gray-400 mb-2">
              {t('form.yourOpinion')} <span className="text-fuchsia-500">*</span>
            </label>
            <textarea
              id="testimonial-comment"
              {...register('comment')}
              rows={5}
              className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
              placeholder={t('form.opinionPlaceholder')}
            />
            <div className="flex justify-between items-center mt-1.5">
              {errors.comment ? (
                <p className="text-red-400 text-sm">{errors.comment.message}</p>
              ) : (
                <span />
              )}
              <p className={`text-sm ${comment.length > 1000 ? 'text-red-400' : 'text-gray-600'}`}>
                {comment.length}/1000
              </p>
            </div>
          </div>

          {/* UPLOAD FOTO */}
          <div className="mb-6">
            <label htmlFor="photo-upload" className="block text-sm text-gray-400 mb-2">
              {t('form.photoOptional')}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoSelect}
              className="hidden"
              id="photo-upload"
            />

            {photoPreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-700">
                <Image
                  src={photoPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>{t('form.uploading')}</span>
                    </div>
                  </div>
                )}
                {!photoUploading && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-32 bg-black/50 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
              >
                <svg className="w-8 h-8 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-zinc-500 text-sm">{t('form.clickToUpload')}</span>
                <span className="text-zinc-600 text-xs mt-1">{t('form.photoFormats')}</span>
              </label>
            )}
          </div>

          {/* CHECKBOXES RGPD */}
          <div className="space-y-4 mb-8 p-5 bg-black/30 rounded-xl border border-zinc-800">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('consentPhotoPublication')}
                className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-zinc-900 mt-0.5 cursor-pointer"
              />
              <span className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">
                {t('form.showName')}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('consentDataProcessing')}
                className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-zinc-900 mt-0.5 cursor-pointer"
              />
              <span className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">
                {t('form.acceptData')}{' '}
                <a href="/legal/privacidad" className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">
                  {t('form.privacyPolicy')}
                </a>{' '}
                <span className="text-fuchsia-500">*</span>
              </span>
            </label>
            {errors.consentDataProcessing && (
              <p className="text-red-400 text-sm ml-8">{errors.consentDataProcessing.message}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('consentMarketing')}
                className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-zinc-900 mt-0.5 cursor-pointer"
              />
              <span className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">
                {t('form.receiveOffers')}
              </span>
            </label>
          </div>

          {/* BOTÓ SUBMIT */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-[length:200%_100%] hover:bg-right text-white font-bold py-4 px-8 rounded-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('form.sending')}
              </>
            ) : (
              <>
                <span>{t('form.submitButton')}</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </motion.button>

          {/* INFO */}
          <p className="text-center text-gray-600 text-xs mt-4">
            {t('form.submitInfo')}
          </p>
        </div>
      </form>
    </motion.div>
  );
}
