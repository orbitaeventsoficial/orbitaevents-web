// app/[locale]/valoracio/client.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SITE_CONFIG } from '@/app/config/site-config';

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

const STEPS = [
  { id: 'rating', title: 'Valoració', icon: '⭐' },
  { id: 'comment', title: 'Comentari', icon: '💬' },
  { id: 'media', title: 'Fotos/Vídeos', icon: '📸' },
  { id: 'contact', title: 'Dades', icon: '👤' },
  { id: 'success', title: 'Gràcies!', icon: '🎉' },
];

function ValoracioContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const ref = searchParams.get('ref');

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(5);

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

  // Calcular descompte en temps real
  useEffect(() => {
    let percent = 5; // Base
    if (form.photoUrl) percent += 5;
    if (form.videoUrl) percent += 10;
    if (form.allowGoogleShare) percent += 5;
    setDiscountPercent(percent);
  }, [form.photoUrl, form.videoUrl, form.allowGoogleShare]);

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
        body: JSON.stringify({
          ...form,
          token,
          bookingRef: ref,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error enviant valoració');
      }

      setDiscountCode(data.discountCode);
      setStep(4); // Success step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    if (step < STEPS.length - 2) {
      setStep(step + 1);
    } else if (step === 3) {
      handleSubmit();
    }
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  function canContinue(): boolean {
    switch (step) {
      case 0: return form.rating > 0;
      case 1: return form.comment.length >= 10;
      case 2: return true; // Optional
      case 3: return form.name.length >= 2 && form.email.includes('@');
      default: return false;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white">
      {/* Header */}
      <header className="py-8 text-center border-b border-amber-500/20">
        <h1 className="text-3xl font-normal">
          <span className="font-bold text-amber-400">ÒRBITA</span> EVENTS
        </h1>
        <p className="text-neutral-400 mt-2">La teva opinió és molt important per a nosaltres</p>
        {ref && (
          <p className="text-xs text-neutral-500 mt-1">Ref: {ref}</p>
        )}
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.id} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-amber-500 text-black'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {i < step ? '✓' : s.icon}
              </div>
              <span className={`text-xs mt-1 ${i === step ? 'text-amber-400' : 'text-neutral-500'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-neutral-800 rounded-full mt-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / (STEPS.length - 2)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Discount preview */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-400/5 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-sm text-neutral-400">El teu descompte actual</p>
          <p className="text-4xl font-bold text-amber-400">{discountPercent}%</p>
          <p className="text-xs text-neutral-500 mt-1">
            {form.photoUrl ? '✓ Foto' : '📸 +5% amb foto'} ·
            {form.videoUrl ? '✓ Vídeo' : '🎬 +10% amb vídeo'} ·
            {form.allowGoogleShare ? '✓ Google' : '⭐ +5% compartint a Google'}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          {/* Step 0: Rating */}
          {step === 0 && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-semibold text-center">Com valoraries la teva experiència?</h2>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => updateForm('rating', star)}
                    className={`text-5xl transition-all transform hover:scale-110 ${
                      star <= form.rating ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {form.rating > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-lg"
                >
                  {form.rating === 5 && '🎉 Increïble! Ens alegra moltíssim!'}
                  {form.rating === 4 && '😊 Molt bé! Gràcies pel teu feedback!'}
                  {form.rating === 3 && '👍 Gràcies! Ens ajudaràs a millorar?'}
                  {form.rating <= 2 && '😔 Ho sentim. Explica&apos;ns més si us plau.'}
                </motion.p>
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
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-center">Explica&apos;ns la teva experiència</h2>

              <textarea
                value={form.comment}
                onChange={(e) => updateForm('comment', e.target.value)}
                rows={6}
                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white placeholder-neutral-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                placeholder="Què és el que més t'ha agradat? Com va ser l'ambient? Recomanaries Òrbita Events?"
              />

              <p className={`text-sm text-right ${form.comment.length >= 10 ? 'text-green-400' : 'text-neutral-500'}`}>
                {form.comment.length} / mínim 10 caràcters
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
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-center">Comparteix fotos o vídeos (opcional)</h2>
              <p className="text-center text-neutral-400">Guanya més descompte compartint!</p>

              <div className="space-y-4">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <label className="block text-sm font-medium text-amber-400 mb-2">
                    📸 Enllaç foto (+5% descompte)
                  </label>
                  <input
                    type="url"
                    value={form.photoUrl}
                    onChange={(e) => updateForm('photoUrl', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-white placeholder-neutral-500 focus:border-amber-500"
                    placeholder="https://drive.google.com/... o Instagram"
                  />
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <label className="block text-sm font-medium text-amber-400 mb-2">
                    🎬 Enllaç vídeo (+10% descompte)
                  </label>
                  <input
                    type="url"
                    value={form.videoUrl}
                    onChange={(e) => updateForm('videoUrl', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-white placeholder-neutral-500 focus:border-amber-500"
                    placeholder="https://youtube.com/... o TikTok"
                  />
                </div>

                <label className="flex items-center gap-3 bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.allowGoogleShare}
                    onChange={(e) => updateForm('allowGoogleShare', e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-600 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium">Compartir a Google Reviews (+5%)</span>
                    <p className="text-sm text-neutral-400">T&apos;enviarem un enllaç directe</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.consentPhotoPublication}
                    onChange={(e) => updateForm('consentPhotoPublication', e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-600 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-medium">Permetre publicació</span>
                    <p className="text-sm text-neutral-400">Podem utilitzar les teves fotos/vídeos a xarxes</p>
                  </div>
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-center">On t&apos;enviem el descompte?</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white placeholder-neutral-500 focus:border-amber-500"
                    placeholder="El teu nom"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white placeholder-neutral-500 focus:border-amber-500"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Telèfon (opcional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 text-white placeholder-neutral-500 focus:border-amber-500"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-10"
            >
              <div className="text-8xl">🎉</div>

              <h2 className="text-3xl font-bold text-amber-400">Gràcies per la teva valoració!</h2>

              <div className="bg-gradient-to-r from-amber-500/20 to-amber-400/10 border-2 border-amber-500 rounded-2xl p-8">
                <p className="text-neutral-400 mb-2">El teu codi de descompte exclusiu</p>
                <p className="text-5xl font-bold text-amber-400 tracking-widest mb-4">{discountCode}</p>
                <p className="text-3xl font-bold text-white">{discountPercent}% DESCOMPTE</p>
                <p className="text-sm text-neutral-500 mt-4">Vàlid durant 6 mesos per al teu pròxim event</p>
              </div>

              <p className="text-neutral-400">
                T&apos;hem enviat un email amb el teu codi i una imatge per compartir.
              </p>

              {/* CTA principal: Deixar ressenya a Google */}
              <a
                href={SITE_CONFIG.reviews.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-white text-[#1a1a1a] font-bold px-8 py-4 rounded-full hover:bg-neutral-100 transition-all shadow-xl shadow-white/10"
              >
                {/* Google G icon */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Deixa la teva ressenya a Google ⭐
              </a>

              <p className="text-xs text-neutral-600">
                La teva ressenya ajuda altres parelles a triar bé 🙏
              </p>

              <a
                href="/"
                className="inline-block text-neutral-500 hover:text-neutral-300 text-sm underline underline-offset-4 transition-colors"
              >
                Tornar a l&apos;inici
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-10">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                step === 0
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
              }`}
            >
              ← Anterior
            </button>

            <button
              onClick={nextStep}
              disabled={!canContinue() || loading}
              className={`px-8 py-3 rounded-full font-bold transition-all ${
                canContinue() && !loading
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300'
                  : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enviant...
                </span>
              ) : step === 3 ? (
                '✓ Enviar i rebre descompte'
              ) : (
                'Següent →'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ValoracioClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black" />}>
      <ValoracioContent />
    </Suspense>
  );
}
