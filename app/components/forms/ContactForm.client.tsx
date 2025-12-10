"use client";
// app/components/forms/ContactForm.client.tsx

import { SITE_CONFIG } from '@/config/site-config';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackLead } from "@/lib/analytics";
import { useTranslations } from "next-intl";

type FormData = {
  name: string;
  contact: string;
  event: string;
  message?: string;
};

export default function ContactForm() {
  const t = useTranslations('contact');
  const [sent, setSent] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------------------------------------------------- */
  /*  SCHEMA ZOD – Validació robusta per email/telèfon                          */
  /* -------------------------------------------------------------------------- */
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[\d\s\-\+\(\)]{9,20}$/;

  const formSchema = z.object({
    name: z.string().min(2, t('form.nameMinChars')).max(50),
    contact: z
      .string()
      .min(5, t('form.contactError'))
      .refine(
        (val) => emailRegex.test(val) || phoneRegex.test(val.replace(/\s/g, '')),
        t('form.contactError')
      ),
    event: z.string().min(1, t('form.eventRequired')),
    message: z.string().max(1000).optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setFocus,
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  /* ------------------------------- AUTO‑FOCUS ------------------------------- */
  useEffect(() => setFocus("name"), [setFocus]);

  /* ------------------------------- SUBMIT ------------------------------- */
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          contact: data.contact,
          message: data.message || "",
          event: data.event,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? t('errors.sendError'));
      }

      /* -------------------------- TRACK LEAD -------------------------- */
      trackLead({
        eventType: data.event,
        source: "contact_form",
      });

      /* -------------------------- ÉXITO -------------------------- */
      setSent(true);
      setConfetti(true);
      reset();
      setTimeout(() => setConfetti(false), 4000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('errors.unknown')
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------- SUCCESS ------------------------------- */
  if (sent) {
    return (
      <motion.div
        className="text-center py-12 glow-gold"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {confetti && (
          <Confetti
            width={typeof window !== "undefined" ? window.innerWidth : 300}
            height={typeof window !== "undefined" ? window.innerHeight : 300}
            recycle={false}
            numberOfPieces={300}
          />
        )}
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 float" />
        <h3 className="text-2xl font-bold mb-2 gradient-text">
          {t('success.title')}
        </h3>
        <p className="text-white/70">
          {t('success.message')}
        </p>
        <p className="text-oe-gold font-bold mt-4">
          {t('success.discount')}
        </p>
      </motion.div>
    );
  }

  /* ------------------------------- FORM ------------------------------- */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* ERROR GLOBAL - amb ARIA live region */}
      <div aria-live="polite" aria-atomic="true">
        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500 rounded-xl p-4 flex items-start gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
          >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">{t('errors.title')}</p>
            <p className="text-red-300 text-sm">{error}</p>
            <a
              href={`tel:${SITE_CONFIG.business.phone}`}
              className="text-oe-gold hover:underline text-sm mt-2 inline-block"
            >
              {t('form.callUs')} {SITE_CONFIG.business.phoneDisplay} →
            </a>
          </div>
        </motion.div>
        )}
      </div>

      {/* NOMBRE */}
      <div>
        <label htmlFor="name" className="block text-sm sm:text-base font-medium mb-2 text-white">
          {t('form.nameRequired')}
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className={`w-full px-4 py-4 sm:py-3.5 bg-white/5 border rounded-xl focus:outline-none transition text-base ${
            errors.name
              ? "border-red-500 focus:border-red-500"
              : "border-white/20 focus:border-[var(--oe-gold)]"
          }`}
          placeholder={t('form.namePlaceholder')}
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <motion.p
            id="name-error"
            className="mt-1 text-red-400 text-sm flex items-center gap-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-4 h-4" />
            {errors.name.message}
          </motion.p>
        )}
      </div>

      {/* CONTACTO */}
      <div>
        <label htmlFor="contact" className="block text-sm sm:text-base font-medium mb-2 text-white">
          {t('form.contact')}
        </label>
        <input
          id="contact"
          type="text"
          {...register("contact")}
          className={`w-full px-4 py-4 sm:py-3.5 bg-white/5 border rounded-xl focus:outline-none transition text-base ${
            errors.contact
              ? "border-red-500 focus:border-red-500"
              : "border-white/20 focus:border-[var(--oe-gold)]"
          }`}
          placeholder={t('form.contactPlaceholder')}
          autoComplete="tel email"
          aria-invalid={!!errors.contact}
          aria-describedby={errors.contact ? "contact-error" : undefined}
        />
        {errors.contact && (
          <motion.p
            id="contact-error"
            className="mt-1 text-red-400 text-sm flex items-center gap-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-4 h-4" />
            {errors.contact.message}
          </motion.p>
        )}
      </div>

      {/* EVENTO */}
      <div>
        <label htmlFor="event" className="block text-sm sm:text-base font-medium mb-2 text-white">
          {t('form.eventType')}
        </label>
        <select
          id="event"
          {...register("event")}
          className={`w-full px-4 py-4 sm:py-3.5 bg-white/5 border rounded-xl focus:outline-none transition text-base ${
            errors.event
              ? "border-red-500 focus:border-red-500"
              : "border-white/20 focus:border-[var(--oe-gold)]"
          }`}
          aria-invalid={!!errors.event}
        >
          <option value="">{t('form.eventSelect')}</option>
          <option value="boda">{t('events.wedding')}</option>
          <option value="discomovil">{t('events.discomovil')}</option>
          <option value="empresa">{t('events.corporate')}</option>
          <option value="fiesta">{t('events.party')}</option>
          <option value="cumpleaños">{t('events.birthday')}</option>
          <option value="tematizacion">{t('events.theming')}</option>
          <option value="otro">{t('events.other')}</option>
        </select>
        {errors.event && (
          <motion.p
            className="mt-1 text-red-400 text-sm flex items-center gap-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-4 h-4" />
            {errors.event.message}
          </motion.p>
        )}
      </div>

      {/* MENSAJE (OPCIONAL) */}
      <div>
        <label htmlFor="message" className="block text-sm sm:text-base font-medium mb-2 text-white">
          {t('form.message')}
        </label>
        <textarea
          id="message"
          {...register("message")}
          rows={3}
          className="w-full px-4 py-4 sm:py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[var(--oe-gold)] focus:outline-none transition resize-none text-base"
          placeholder={t('form.messagePlaceholder')}
        />
      </div>

      {/* CTA WOW */}
      <motion.button
        type="submit"
        disabled={isSubmitting || loading}
        className="w-full oe-btn-gold flex items-center justify-center gap-2 shadow-2xl glow-gold breathe disabled:opacity-50 disabled:cursor-not-allowed py-4 sm:py-3.5 text-base sm:text-lg"
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        aria-label={t('form.submit')}
      >
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            aria-label={t('form.submitting')}
          />
        ) : (
          <Send className="w-5 h-5" />
        )}
        <span className="font-bold">
          {loading ? t('form.submitting') : t('form.submit')}
        </span>
      </motion.button>

      {/* PRIVACIDAD */}
      <p className="text-xs text-white/40 text-center">
        {t('privacy')}{" "}
        <a href="/legal/privacidad" className="text-oe-gold hover:underline">
          {t('privacyPolicy')}
        </a>
        . {t('responseTime')}
      </p>
    </form>
  );
}

