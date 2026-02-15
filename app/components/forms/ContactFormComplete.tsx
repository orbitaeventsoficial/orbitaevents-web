// ============================================================
// FORMULARI DE CONTACTE COMPLET I LEGAL
// ============================================================
// - Nom complet (obligatori)
// - Email (obligatori)
// - Telefon (obligatori)
// - Tipus d'event
// - Data aproximada
// - Nombre de convidats
// - Missatge
// - Checkbox RGPD (obligatori)
// - Checkbox newsletter (opcional)
// - Captcha matematic
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/config/site-config';
import { trackLead } from '@/lib/analytics';
import { fetchWithCsrf } from '@/lib/csrf';
import TurnstileWidget from '@/components/security/TurnstileWidget';

// ============================================================
// TIPUS
// ============================================================

interface FormData {
  // Dades personals
  fullName: string;
  email: string;
  phone: string;

  // Dades event
  eventType: string;
  eventDate: string;
  guestCount: string;
  location: string;
  budget: string;

  // Missatge
  message: string;
  howFound: string;

  // Legals
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
}

interface FormErrors {
  [key: string]: string;
}

// ============================================================
// VALIDACIO
// ============================================================

function validateForm(data: FormData, t: (key: string) => string): FormErrors {
  const errors: FormErrors = {};

  // Nom complet
  if (!data.fullName.trim()) {
    errors.fullName = t('validation.fullNameRequired');
  } else if (data.fullName.trim().length < 3) {
    errors.fullName = t('validation.fullNameMinLength');
  } else if (!data.fullName.includes(' ')) {
    errors.fullName = t('validation.fullNameLastName');
  }

  // Email
  if (!data.email.trim()) {
    errors.email = t('validation.emailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t('validation.emailInvalid');
  }

  // Telefon
  if (!data.phone.trim()) {
    errors.phone = t('validation.phoneRequired');
  } else if (!/^[0-9+\s()-]{9,}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = t('validation.phoneInvalid');
  }

  // Tipus event
  if (!data.eventType) {
    errors.eventType = t('validation.eventTypeRequired');
  }

  // Data (opcional pero si hi es, ha de ser futura)
  if (data.eventDate) {
    const selectedDate = new Date(data.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.eventDate = t('validation.dateFuture');
    }
  }

  // Privacitat (obligatori)
  if (!data.acceptPrivacy) {
    errors.acceptPrivacy = t('validation.privacyRequired');
  }

  return errors;
}

// ============================================================
// SIMPLE CAPTCHA (alternativa a reCAPTCHA)

// ============================================================
// COMPONENT PRINCIPAL
// ============================================================

export default function ContactFormComplete({
  preselectedService,
  preselectedDate,
}: {
  preselectedService?: string;
  preselectedDate?: string;
}) {
  const t = useTranslations('contactForm');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    eventType: preselectedService || '',
    eventDate: preselectedDate || '',
    guestCount: '',
    location: '',
    budget: '',
    message: '',
    howFound: '',
    acceptPrivacy: false,
    acceptMarketing: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [minDate, setMinDate] = useState(''); // Hydration-safe: set in useEffect
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Set minDate on client to avoid hydration mismatch
  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Update form
  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Mark field as touched
  const touchField = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Validate on blur
  const validateField = (field: keyof FormData) => {
    const fieldErrors = validateForm(formData, t);
    if (fieldErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all
    const formErrors = validateForm(formData, t);

    setErrors(formErrors);

    // Mark all as touched
    const allTouched: { [key: string]: boolean } = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (Object.keys(formErrors).length > 0) {
      // Scroll to first error
      const firstError = document.querySelector('.error-field');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validate Turnstile token
    if (!turnstileToken) {
      setErrors({ ...formErrors, turnstile: t('validation.captchaRequired') });
      return;
    }

    setIsSubmitting(true);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetchWithCsrf('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name: formData.fullName,
          contact: formData.email,
          phone: formData.phone,
          event: formData.eventType,
          eventDate: formData.eventDate,
          guestCount: formData.guestCount,
          location: formData.location,
          budget: formData.budget,
          message: formData.message,
          howFound: formData.howFound,
          acceptMarketing: formData.acceptMarketing,
          timestamp: new Date().toISOString(),
          source: 'contact-form-complete',
          turnstileToken,
        }),
      });

      if (response.ok) {
        // Track lead
        trackLead({
          eventType: formData.eventType,
          source: 'contact_form_complete',
        });

        setSubmitStatus('success');

        // Redirigir a página de gracias
        setTimeout(() => {
          window.location.href = '/gracias';
        }, 1000); // Pequeño delay para que se vea el success
      } else {
        throw new Error('Error al enviar');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  // Success message
  if (submitStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-2xl bg-green-500/10 border border-green-500/30 text-center"
      >
        <span className="text-6xl block mb-4">🎉</span>
        <h3 className="text-2xl font-bold text-white mb-2">{t('success.title')}</h3>
        <p className="text-white/70 mb-6">
          {t('success.message')}
        </p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          {t('success.sendAnother')}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seccio: Dades personals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>👤</span> {t('sections.personalData')}
        </h3>

        {/* Nom complet */}
        <div className={errors.fullName && touched.fullName ? 'error-field' : ''}>
          <label htmlFor="fullName" className="block text-white/70 text-sm mb-2">
            {t('labels.fullName')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            onBlur={() => { touchField('fullName'); validateField('fullName'); }}
            placeholder={t('placeholders.fullName')}
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-base
                     placeholder:text-white/50 outline-none transition-all
                     ${errors.fullName && touched.fullName
                       ? 'border-red-500 focus:ring-red-500'
                       : 'border-white/10 focus:border-amber-500 focus:ring-amber-500'
                     } focus:ring-2`}
          />
          {errors.fullName && touched.fullName && (
            <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Email i Telefon */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Email */}
          <div className={errors.email && touched.email ? 'error-field' : ''}>
            <label htmlFor="email" className="block text-white/70 text-sm mb-2">
              {t('labels.email')} <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => { touchField('email'); validateField('email'); }}
              placeholder={t('placeholders.email')}
              className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-base
                       placeholder:text-white/50 outline-none transition-all
                       ${errors.email && touched.email
                         ? 'border-red-500'
                         : 'border-white/10 focus:border-amber-500'
                       } focus:ring-2 focus:ring-amber-500`}
            />
            {errors.email && touched.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Telefon */}
          <div className={errors.phone && touched.phone ? 'error-field' : ''}>
            <label htmlFor="phone" className="block text-white/70 text-sm mb-2">
              {t('labels.phone')} <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              onBlur={() => { touchField('phone'); validateField('phone'); }}
              placeholder={t('placeholders.phone')}
              className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-base
                       placeholder:text-white/50 outline-none transition-all
                       ${errors.phone && touched.phone
                         ? 'border-red-500'
                         : 'border-white/10 focus:border-amber-500'
                       } focus:ring-2 focus:ring-amber-500`}
            />
            {errors.phone && touched.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seccio: Dades event */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🎉</span> {t('sections.eventData')}
        </h3>

        {/* Tipus event */}
        <div className={errors.eventType && touched.eventType ? 'error-field' : ''}>
          <label htmlFor="eventType" className="block text-white/70 text-sm mb-2">
            {t('labels.eventType')} <span className="text-red-400">*</span>
          </label>
          <select
            id="eventType"
            name="eventType"
            value={formData.eventType}
            onChange={(e) => updateField('eventType', e.target.value)}
            onBlur={() => { touchField('eventType'); validateField('eventType'); }}
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-base
                     outline-none transition-all appearance-none cursor-pointer
                     ${errors.eventType && touched.eventType
                       ? 'border-red-500'
                       : 'border-white/10 focus:border-amber-500'
                     } focus:ring-2 focus:ring-amber-500`}
          >
            <option value="" className="bg-black">{t('placeholders.selectEventType')}</option>
            <option value="boda" className="bg-black">{t('eventTypes.boda')}</option>
            <option value="fiesta" className="bg-black">{t('eventTypes.fiesta')}</option>
            <option value="cumpleanos" className="bg-black">{t('eventTypes.cumpleanos')}</option>
            <option value="corporativo" className="bg-black">{t('eventTypes.corporativo')}</option>
            <option value="comunion" className="bg-black">{t('eventTypes.comunion')}</option>
            <option value="graduacion" className="bg-black">{t('eventTypes.graduacion')}</option>
            <option value="otro" className="bg-black">{t('eventTypes.otro')}</option>
          </select>
          {errors.eventType && touched.eventType && (
            <p className="text-red-400 text-sm mt-1">{errors.eventType}</p>
          )}
        </div>

        {/* Data i Convidats */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Data */}
          <div>
            <label htmlFor="eventDate" className="block text-white/70 text-sm mb-2">
              {t('labels.eventDate')}
            </label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={formData.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              min={minDate}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white text-base outline-none focus:border-amber-500 focus:ring-2
                       focus:ring-amber-500 transition-all"
            />
            {errors.eventDate && (
              <p className="text-red-400 text-sm mt-1">{errors.eventDate}</p>
            )}
          </div>

          {/* Convidats */}
          <div>
            <label htmlFor="guestCount" className="block text-white/70 text-sm mb-2">
              {t('labels.guestCount')}
            </label>
            <select
              id="guestCount"
              name="guestCount"
              value={formData.guestCount}
              onChange={(e) => updateField('guestCount', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white text-base outline-none focus:border-amber-500 focus:ring-2
                       focus:ring-amber-500 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-black">{t('placeholders.selectGuests')}</option>
              <option value="1-50" className="bg-black">{t('guestOptions.1-50')}</option>
              <option value="51-100" className="bg-black">{t('guestOptions.51-100')}</option>
              <option value="101-200" className="bg-black">{t('guestOptions.101-200')}</option>
              <option value="201-300" className="bg-black">{t('guestOptions.201-300')}</option>
              <option value="300+" className="bg-black">{t('guestOptions.300+')}</option>
            </select>
          </div>
        </div>

        {/* Ubicacio i Pressupost */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Ubicacio */}
          <div>
            <label htmlFor="location" className="block text-white/70 text-sm mb-2">
              {t('labels.location')}
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder={t('placeholders.location')}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white text-base placeholder:text-white/50 outline-none
                       focus:border-amber-500 focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Pressupost */}
          <div>
            <label htmlFor="budget" className="block text-white/70 text-sm mb-2">
              {t('labels.budget')}
            </label>
            <select
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={(e) => updateField('budget', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white text-base outline-none focus:border-amber-500 focus:ring-2
                       focus:ring-amber-500 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-black">{t('placeholders.selectBudget')}</option>
              <option value="menys500" className="bg-black">{t('budgetOptions.menys500')}</option>
              <option value="500-1000" className="bg-black">{t('budgetOptions.500-1000')}</option>
              <option value="1000-2000" className="bg-black">{t('budgetOptions.1000-2000')}</option>
              <option value="2000-3000" className="bg-black">{t('budgetOptions.2000-3000')}</option>
              <option value="3000+" className="bg-black">{t('budgetOptions.3000+')}</option>
              <option value="nosabe" className="bg-black">{t('budgetOptions.nosabe')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seccio: Missatge */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>💬</span> {t('sections.tellUsMore')}
        </h3>

        {/* Missatge */}
        <div>
          <label htmlFor="message" className="block text-white/70 text-sm mb-2">
            {t('labels.message')}
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={(e) => updateField('message', e.target.value)}
            placeholder={t('placeholders.message')}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-white text-base placeholder:text-white/50 outline-none resize-none
                     focus:border-amber-500 focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

      </div>

      {/* Com ens has trobat (opcional - al final) */}
      <div className="pt-4">
        <label htmlFor="howFound" className="block text-white/50 text-sm mb-2">
          {t('labels.howFound')} <span className="text-white/50">(opcional)</span>
        </label>
        <select
          id="howFound"
          name="howFound"
          value={formData.howFound}
          onChange={(e) => updateField('howFound', e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                   text-white text-base outline-none focus:border-amber-500 focus:ring-2
                   focus:ring-amber-500 transition-all appearance-none cursor-pointer"
        >
          <option value="" className="bg-black">{t('placeholders.selectHowFound')}</option>
          <option value="google" className="bg-black">{t('howFoundOptions.google')}</option>
          <option value="instagram" className="bg-black">{t('howFoundOptions.instagram')}</option>
          <option value="tiktok" className="bg-black">{t('howFoundOptions.tiktok')}</option>
          <option value="recomendacion" className="bg-black">{t('howFoundOptions.recomendacion')}</option>
          <option value="evento" className="bg-black">{t('howFoundOptions.evento')}</option>
          <option value="otro" className="bg-black">{t('howFoundOptions.otro')}</option>
        </select>
      </div>

      {/* Seccio: Legal */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        {/* Checkbox privacitat */}
        <div className={`${errors.acceptPrivacy && touched.acceptPrivacy ? 'error-field' : ''}`}>
          <label htmlFor="acceptPrivacy" className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-1 h-5 w-5 shrink-0">
              <input
                type="checkbox"
                id="acceptPrivacy"
                name="acceptPrivacy"
                checked={formData.acceptPrivacy}
                onChange={(e) => updateField('acceptPrivacy', e.target.checked)}
                onBlur={() => touchField('acceptPrivacy')}
                className="peer absolute inset-0 z-10 h-5 w-5 cursor-pointer appearance-none opacity-0"
              />
              <div className={`w-5 h-5 rounded border-2 transition-all
                           peer-checked:bg-amber-500 peer-checked:border-amber-500
                           ${errors.acceptPrivacy && touched.acceptPrivacy
                             ? 'border-red-500'
                             : 'border-white/30 group-hover:border-white/50'
                           }`}>
                {formData.acceptPrivacy && (
                  <svg className="w-full h-full text-black p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-white/70 text-sm">
              {t('privacy.text')}{' '}
              <Link href="/legal/privacidad" className="text-amber-400 hover:underline" target="_blank" rel="noopener noreferrer">
                {t('privacy.link')}
              </Link>{' '}
              {t('privacy.and')}{' '}
              <Link href="/legal/terminos" className="text-amber-400 hover:underline" target="_blank" rel="noopener noreferrer">
                {t('privacy.termsLink')}
              </Link>
              . <span className="text-red-400">*</span>
            </span>
          </label>
          {errors.acceptPrivacy && touched.acceptPrivacy && (
            <p className="text-red-400 text-sm mt-1 ml-8">{errors.acceptPrivacy}</p>
          )}
        </div>

        {/* Checkbox marketing */}
        <label htmlFor="acceptMarketing" className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-1 h-5 w-5 shrink-0">
            <input
              type="checkbox"
              id="acceptMarketing"
              name="acceptMarketing"
              checked={formData.acceptMarketing}
              onChange={(e) => updateField('acceptMarketing', e.target.checked)}
              className="peer absolute inset-0 z-10 h-5 w-5 cursor-pointer appearance-none opacity-0"
            />
            <div className="w-5 h-5 rounded border-2 border-white/30 transition-all
                         group-hover:border-white/50
                         peer-checked:bg-amber-500 peer-checked:border-amber-500">
              {formData.acceptMarketing && (
                <svg className="w-full h-full text-black p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-white/70 text-sm">
            {t('marketing.text')}
          </span>
        </label>
      </div>

      {/* Info RGPD */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50">
        <p className="mb-2">
          <strong className="text-white/70">{t('gdpr.title')}</strong>
        </p>
        <ul className="space-y-1">
          <li>• <strong>{t('gdpr.responsible')}:</strong> {t('gdpr.responsibleValue')}</li>
          <li>• <strong>{t('gdpr.purpose')}:</strong> {t('gdpr.purposeValue')}</li>
          <li>• <strong>{t('gdpr.legitimacy')}:</strong> {t('gdpr.legitimacyValue')}</li>
          <li>• <strong>{t('gdpr.recipients')}:</strong> {t('gdpr.recipientsValue')}</li>
          <li>• <strong>{t('gdpr.rights')}:</strong> {t('gdpr.rightsValue')}</li>
          <li>• <strong>{t('gdpr.contact')}:</strong> {SITE_CONFIG.business.email}</li>
        </ul>
      </div>

      {/* Error general */}
      <AnimatePresence>
        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {t('error.message')}{' '}
            <a href={`tel:${SITE_CONFIG.business.phone}`} className="underline">{SITE_CONFIG.business.phoneDisplay}</a>.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Turnstile CAPTCHA */}
      <div className="pt-4">
        <TurnstileWidget
          onSuccess={(token) => {
            setTurnstileToken(token);
            if (errors.turnstile) {
              setErrors({ ...errors, turnstile: '' });
            }
          }}
          onError={() => setTurnstileToken(null)}
          onExpire={() => setTurnstileToken(null)}
          theme="dark"
        />
        {errors.turnstile && touched.turnstile && (
          <p className="text-red-400 text-sm mt-2 text-center">{errors.turnstile}</p>
        )}
      </div>

      {/* Boto submit */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all
                 ${isSubmitting
                   ? 'bg-white/20 text-white/50 cursor-not-allowed'
                   : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
                 }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('sending')}
          </span>
        ) : (
          t('submit')
        )}
      </motion.button>

      {/* Nota final */}
      <p className="text-center text-white/60 text-sm">
        {t('responseNote')}{' '}
        <a href={`tel:${SITE_CONFIG.business.phone}`} className="text-amber-400 hover:underline">
          {SITE_CONFIG.business.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
