'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';

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

interface TestimonialFormProps {
  token?: string | null;
  bookingRef?: string | null;
  onSuccess?: (code: string, percent: number) => void;
}

type TestimonialSubmitResponse = {
  discountCode?: unknown;
  discountPercent?: unknown;
};

type TestimonialSubmitPayload = FormData & {
  token?: string;
  bookingRef?: string;
};

function buildTestimonialSubmitPayload(
  form: FormData,
  token?: string | null,
  bookingRef?: string | null,
): TestimonialSubmitPayload {
  const payload: TestimonialSubmitPayload = { ...form };
  const safeToken = token?.trim();
  const safeBookingRef = bookingRef?.trim();

  if (safeToken) payload.token = safeToken;
  if (safeBookingRef) payload.bookingRef = safeBookingRef;

  return payload;
}

export default function TestimonialForm({ token, bookingRef, onSuccess }: TestimonialFormProps) {
  const t = useTranslations('testimonialForm');
  const commentTitleId = useId();
  const photoUrlId = useId();
  const videoUrlId = useId();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string; percent: number } | null>(null);

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

  const STEP_KEYS = ['rating', 'comment', 'media', 'contact'] as const;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildTestimonialSubmitPayload(form, token, bookingRef)),
      });
      const data = await res.json().catch(() => null) as TestimonialSubmitResponse | null;
      if (!res.ok) throw new Error('testimonial-submit-failed');

      const code = typeof data?.discountCode === 'string' ? data.discountCode : null;
      const percent = typeof data?.discountPercent === 'number' ? data.discountPercent : null;
      if (!code || percent === null) throw new Error('testimonial-submit-failed');

      setSuccess({ code, percent });
      onSuccess?.(code, percent);
    } catch {
      setError(t('errors.submitError'));
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

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-sm border border-amber-500/30 rounded-lg p-8 text-center"
      >
        <div className="text-8xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-amber-400 mb-4">{t('success.title')}</h2>
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-2 border-amber-500 rounded-lg p-8 mb-6">
          <p className="text-white/60 mb-2">{t('success.exclusiveCode')}</p>
          <p className="text-5xl font-bold text-amber-400 tracking-widest mb-4">{success.code}</p>
          <p className="text-3xl font-bold text-white">{success.percent}% {t('success.discount')}</p>
          <p className="text-sm text-white/50 mt-4">{t('success.validFor')}</p>
        </div>
        <p className="text-white/60 mb-6">{t('success.codeByEmail')}</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 font-bold text-black transition-all hover:shadow-lg hover:shadow-amber-500/30"
        >
          {t('success.backHome')}
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
      {/* Progress */}
      <div className="flex justify-between mb-8">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-amber-500 text-black' :
              'bg-white/10 text-white/50'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-2 ${i === step ? 'text-amber-400' : 'text-white/50'}`}>
              {t(`gamified.steps.${key}`)}
            </span>
          </div>
        ))}
      </div>

      {/* Discount Preview */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4 mb-8 text-center">
        <p className="text-white/60 text-sm">{t('gamified.navigation.currentReward')}</p>
        <p className="text-4xl font-bold text-amber-400">{discountPercent}%</p>
        <p className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-white/60">
          <span className="rounded-md border border-white/10 px-2 py-1">
            {form.photoUrl ? t('gamified.rewards.photoDone') : t('gamified.rewards.photo')}
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1">
            {form.videoUrl ? t('gamified.rewards.videoDone') : t('gamified.rewards.video')}
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1">
            {form.allowGoogleShare ? t('gamified.rewards.googleDone') : t('gamified.rewards.google')}
          </span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Rating */}
        {step === 0 && (
          <motion.div key="rating" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
            <h3 className="text-2xl font-semibold text-white mb-8">{t('gamified.rating.title')}</h3>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateForm('rating', star)}
                  aria-label={t('gamified.rating.starLabel', {
                    rating: star,
                    label: t(`form.ratingLabels.${star}`),
                  })}
                  aria-pressed={star === form.rating}
                  className={`text-5xl transition-all hover:scale-110 ${star <= form.rating ? 'text-amber-400' : 'text-white/30 hover:text-white/50'}`}
                >
                  ★
                </button>
              ))}
            </div>
            {form.rating > 0 && (
              <p className="text-white/70">{t(`gamified.emojiMessages.${form.rating}`)}</p>
            )}
          </motion.div>
        )}

        {/* Step 1: Comment */}
        {step === 1 && (
          <motion.div key="comment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 id={commentTitleId} className="text-2xl font-semibold text-white mb-6 text-center">{t('gamified.comment.title')}</h3>
            <textarea
              aria-labelledby={commentTitleId}
              value={form.comment}
              onChange={(e) => updateForm('comment', e.target.value)}
              rows={5}
              className="w-full bg-white/5 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              placeholder={t('gamified.comment.commentPlaceholder')}
            />
            <p className={`text-sm text-right mt-2 ${form.comment.length >= 10 ? 'text-green-400' : 'text-white/50'}`}>
              {form.comment.length} / {t('validation.commentMin')}
            </p>
          </motion.div>
        )}

        {/* Step 2: Media */}
        {step === 2 && (
          <motion.div key="media" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">{t('gamified.media.title')}</h3>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <label htmlFor={photoUrlId} className="block text-sm font-medium text-amber-400 mb-2">📸 {t('gamified.media.addPhoto')} ({t('gamified.media.photoDiscount')})</label>
              <input id={photoUrlId} type="url" value={form.photoUrl} onChange={(e) => updateForm('photoUrl', e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-amber-500"
                placeholder="https://drive.google.com/... / Instagram" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <label htmlFor={videoUrlId} className="block text-sm font-medium text-amber-400 mb-2">🎬 {t('gamified.media.addVideo')} ({t('gamified.media.videoDiscount')})</label>
              <input id={videoUrlId} type="url" value={form.videoUrl} onChange={(e) => updateForm('videoUrl', e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-amber-500"
                placeholder="https://youtube.com/... / TikTok" />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-amber-500/50">
              <input type="checkbox" checked={form.allowGoogleShare} onChange={(e) => updateForm('allowGoogleShare', e.target.checked)}
                className="w-5 h-5 rounded border-white/30 text-amber-500 focus:ring-amber-500" />
              <div>
                <span className="font-medium text-white">{t('gamified.nps.googleShare')}</span>
                <p className="text-sm text-white/50">{t('gamified.nps.googleDiscount')}</p>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <input type="checkbox" checked={form.consentPhotoPublication} onChange={(e) => updateForm('consentPhotoPublication', e.target.checked)}
                className="w-5 h-5 rounded border-white/30 text-amber-500 focus:ring-amber-500" />
              <div>
                <span className="font-medium text-white">{t('gamified.consent.showName')}</span>
              </div>
            </label>
          </motion.div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">{t('gamified.yourData.title')}</h3>

            <div>
              <label htmlFor={nameId} className="block text-sm font-medium text-white/70 mb-2">{t('form.name')} *</label>
              <input id={nameId} type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:border-amber-500"
                required />
            </div>

            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-white/70 mb-2">{t('form.email')} *</label>
              <input id={emailId} type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:border-amber-500"
                required />
            </div>

            <div>
              <label htmlFor={phoneId} className="block text-sm font-medium text-white/70 mb-2">{t('form.phoneOptional')}</label>
              <input id={phoneId} type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:border-amber-500" />
            </div>

            {error && (
              <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-center">{error}</div>
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
          className={`rounded-lg px-6 py-3 font-medium transition-all ${
            step === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <span aria-hidden="true">←</span> {t('gamified.navigation.previous')}
        </button>

        <button
          type="button"
          onClick={() => step === 3 ? handleSubmit() : setStep(step + 1)}
          disabled={!canContinue() || loading}
          className={`rounded-lg px-8 py-3 font-bold transition-all ${
            canContinue() && !loading
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('gamified.navigation.submitting')}
            </span>
          ) : step === 3 ? (
            <>
              <span aria-hidden="true">✓</span> {t('gamified.navigation.submit')}
            </>
          ) : (
            <>
              {t('gamified.navigation.next')} <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
